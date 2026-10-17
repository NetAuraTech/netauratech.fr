---
status: accepted
date: 2026-10-13
context:
  - The cache seam (`CacheDriver` contract + `CacheService` facade, ADR-002) exposed two mutually exclusive drivers (Redis, in-memory) plus the atomic primitives `setIfAbsent` / `compareAndSet` / `compareAndDelete`, covered by a shared contract suite
  - `LockService` bypassed the seam: direct `redis.connection()`, its own in-memory `Map`, a sticky `redisAvailable` flag, and a Lua release script duplicating the redis driver's existing `CAD_SCRIPT`
  - `MaintenanceService` bypassed the seam the same way: direct `redis.get/set/expire`, its own `memoryConfig` fallback, a sticky `redisAvailable` flag, and a hand-rolled memory<->Redis reconciliation policy
  - Single-process / no-Redis environments are a supported deployment mode, as already documented on `InMemoryCacheDriver`
---

## Context

Two modules needed "Redis if available, process-local memory otherwise" behaviour, and each implemented it from scratch: its own redis client, its own memory map, its own sticky availability flag, and (for locks) its own compare-and-delete Lua script. The cache seam already implements exactly that algorithm — `CAD_SCRIPT` in the redis driver, a synchronous equivalent in the in-memory driver — behind a single contract with a shared test suite.

The seam's one missing piece was a driver that _combines_ the two tiers: the two existing drivers were mutually exclusive constructor options, so the redis-primary + memory-fallback pattern had to be re-implemented at every consumer.

## Decision

**A new `FailoverCacheDriver` lives in the seam, and the root `CacheService` binding is it.** The composite wraps a primary tier (Redis in production) and a fallback tier (a process-local `InMemoryCacheDriver` by default).

- **Failover semantics are per-call and self-healing.** Every operation tries the primary tier first; when it throws, the same operation is replayed on the fallback tier. The next operation tries the primary again — there is no sticky "primary is down" flag, so recovery is automatic. One log line per tier transition (warn on fallback, info on recovery), never one per call.
- **Failover is per-call, not per-value.** Keys written while the primary is down live in the fallback tier and are not visible from the primary after recovery. Cache tiers are for performance and coordination within a window; anything needing durability across outages must persist outside the cache.
- **The root binding changes from "Redis or error" to "Redis or process-local".** This is a deliberate system-level choice: single-process / no-Redis deployments keep working for every consumer of the root `CacheService` (page-render cache, builder sessions, locks) without each of them re-implementing fallback. `InMemoryCacheDriver` remains the binding for hermetic tests.
- **`LockService` consumes the seam's atomic primitives** on a `lock` namespace: acquire is `setIfAbsent`, release is `compareAndDelete`. Its private memory map, sticky flag, direct redis client, and Lua script are deleted; the release algorithm lives only in the redis driver. Key dialects are unchanged (`lock:<name>`), so no Redis data migration.
- **`MaintenanceService` routes its transport through the same seam**: raw `redis.get/set/expire` become `CacheService` calls on the unchanged `maintenance:config` key, while its documented fallback lifecycle (initialize → explicit override → reconcile on Redis recovery, the `_explicitlySet` flag) is preserved.
- **The composite exposes its current tier for lifecycle consumers.** A read-only `currentTier` (typed with the shared `CacheTier` type) is declared on the `CacheDriver` contract and implemented by composite drivers, surfaced through the facade as `CacheService.tier` (`null` for single-tier drivers with no tier state); it lets a consumer that must distinguish a primary-served result from a fallback-served one — the maintenance reconciliation lifecycle — poll the composite between operations without re-introducing a sticky availability flag of its own.
- **The maintenance payload format is unchanged.** The pre-seam transport already stored a single-encoded JSON object (`redis.set(key, JSON.stringify(payload))`), and the seam's driver performs the identical encoding — values stored before the rollout decode to the same objects after it, so no data migration or compatibility shim is needed.

## Consequences

- **Positive:** the redis-primary + memory-fallback pattern now has exactly one implementation; the compare-and-delete Lua script exists in exactly one place; lock and maintenance tests can run hermetically against the in-memory tier; no-Redis deployments degrade to process-local caching instead of erroring.
- **Negative:** during a Redis outage, cache state is process-local — a write made by one process during the outage is not visible to other processes, and keys written during the outage are not visible from Redis after recovery. Consumers that depend on cross-process visibility (named locks across workers) accept this as the cost of availability; the composite logs every transition so the degraded window is observable.
- **Negative:** the composite's `flush()` on a live primary wipes the whole Redis database (existing `RedisCacheDriver` behaviour, now reachable through the root binding's consumers as before — callers must keep using it with care).
