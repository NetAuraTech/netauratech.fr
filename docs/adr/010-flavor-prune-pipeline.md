---
status: accepted
date: 2026-08-10
context:
  - The Multi-Flavor Installer epic (#9) ships the same codebase as three branches: main (full), inertia, api
  - Flavor branches must be reproducible artifacts of main, never hand-maintained
  - Prune behavior was previously only encoded in code comments and the CI workflow, with no first-class decision record
---

## Context

The Multi-Flavor Installer epic (#9, spec #4) delivers `adonisjs-foundry` as three installable flavors: **`main`** (the full tree), **`inertia`** (no CMS), and **`api`** (headless REST, no frontend). The flavor branches exist — they are CI-regenerated artifacts — but the _decision_ behind the pipeline that produces them was recorded only in scattered code comments and the CI workflow; no first-class, versioned record links the "branches as artifacts" contract, the declarative manifest schema, the rewrite allowlist, and the failure modes.

This ADR records that decision so agents and users can reason about the flavor system from one document.

The precursor is [ADR 0001](./0001-cms-module-extraction.md). ADR-0001 made the CMS a **prunable vertical slice** (`app/cms/`, "if it dies when the CMS dies, it lives in `app/cms/`") and moved the module's smeared paths into per-domain subdirectories that are each a single-directory delete. That structural work is what makes a _mechanical_ prune pipeline viable: a manifest can express each flavor as a list of deletions against a well-shaped `main`, instead of a script with business knowledge baked in.

## Decision

### Branches as artifacts

`main` is the **single source of truth** and the only branch edited by humans. The `inertia` and `api` flavor branches are **CI-regenerated build artifacts**: they are produced from a clean checkout of `main` by applying a declarative prune manifest, then force-pushed on success. They only _subtract_ from `main`; they never diverge structurally.

Consequences of the contract:

- Never commit to a flavor branch directly. Never "fix" a flavor branch as a workaround — a fix on a flavor branch would be overwritten at the next regeneration.
- A flavor branch carries its own `README.md` (rewritten by its manifest) documenting its conventions, and it deletes the whole prune tooling (`tooling/prune/`) so its tree is self-contained and free of main-only infrastructure.
- Because flavor branches are generated, `git diff main->inertia` and `git diff main->api` are _supposed_ to be non-empty only where the flavor subtracts — exactly the manifest's effect.

### Declarative prune manifests

Each flavor owns a manifest at `tooling/prune/flavors/<flavor>.manifest.ts` (e.g. `inertia.manifest.ts`, `api.manifest.ts`). The manifest is declarative and mechanical — the engine performs no inference — and describes three kinds of edits against a clean checkout of `main`:

| Field          | Meaning                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `flavor`       | Flavor identifier, matching the branch name.                                                             |
| `delete`       | Literal file or directory paths to delete (no globs). Stale entries fail loudly (see Failure modes).     |
| `rewrites`     | Full replacement content for allowlisted config/composition files (see the closed rewrite allowlist).    |
| `dependencies` | Optional npm package names pruned from every dependency map of `package.json` (removal only, never add). |

Rewrites supply the file's **complete post-prune content** — the engine overwrites the file verbatim, never merges. Keeping replacements declarative means the flavor tree is reproducible from the manifest alone, with no hidden engine logic. On the flavor branch the manifest itself is deleted, so the branch ships as a finished product, not a recipe.

### The closed rewrite allowlist

Flavor variation is confined to configuration, startup composition, and docs. The `REWRITE_ALLOWLIST` in `tooling/prune/types.ts` is the closed list of files a manifest may rewrite:

- `adonisrc.ts` — provider/preload/command lists vary per flavor.
- `config/{features,database,shield,cors}.ts` — feature flags, migration paths, CSP hosts, CORS policy.
- `start/{routes,events,nav,dashboard,container,transmit,sitemap}.ts` — startup composition files that register domain contributors (routes, nav entries, dashboard collectors, sitemap collectors, container bindings).
- `start/{asset_middleware,env}.ts`, `.env.example` — asset middleware seam and environment validation/template.
- `package.json`, `tsconfig.json` — scripts, dependency maps, project references.
- `README.md` — flavor-specific documentation.

**Rewriting business code is a validation error.** Service, repository, model, controller, validator, exception, transformer, event, listener, and Inertia code can only ever exist identically on every flavor or be deleted wholesale. This is what keeps a flavor a _strict subset_ of `main` rather than a fork.

### Coupling rule: refactor `main`, never patch a flavor

A hard coupling discovered while pruning is a signal that **`main` should be refactored** — the kept code must not reference pruned code. Patching a flavor branch would break the "branches as artifacts" contract. The `api` and `inertia` manifests document exactly this: "Any coupling discovered between kept code and the pruned view/CMS layer while implementing was resolved by refactoring `main`, never by patching this manifest."

### Failure modes

The pipeline is designed to **fail loudly before deleting anything**. The engine validates the full manifest against the tree first; only if validation passes does it mutate:

- **`StaleManifestError`** — a manifest references a `delete` path that no longer exists on `main`. A renamed or removed file silently left in the manifest would otherwise under-prune the flavor branch, shipping dead or broken code. The error lists every missing path at once.
- **`DisallowedRewriteError`** — a manifest rewrites a file outside the closed allowlist. This protects the boundary that keeps flavor variation out of business code; it lists the offending paths and the allowlist.

The engine's `apply` validates, then deletes, rewrites, and prunes dependencies — no partial success: either the whole manifest applies cleanly or it throws before touching anything. `dryRun` validates and reports planned actions without mutating, for CI pre-checks and local inspection.

### CI cascade

`.github/workflows/flavor-prune.yml` regenerates flavor branches on every push to `main`, in stages that guarantee a broken `main` never propagates into a flavor:

1. **Main gates** — wait for the `ci.yml` CI workflow to succeed on the pushed SHA (lint, typecheck, all tests, codegen drift). If `main` is red, no flavor is regenerated.
2. **Discover flavors** — read the manifests present in `tooling/prune/flavors/`; adding a flavor is purely adding a manifest file.
3. **Per-flavor prune + gates** — for each flavor, in a matrix with `fail-fast: false`: checkout `main` → apply the manifest → clean-install → **regenerate the AdonisJS/Tuyau codegen** (the delete list wipes `.adonisjs/`) → run the surviving flavor gates (backend typecheck, inertia typecheck if the tree survives, lint, prettier, frontend tests if the frontend survives, and the remaining backend suites) → commit → force-push the flavor branch.

A failed prune or gate blocks only **that flavor's** publication; it never blocks `main`. Each flavor branch is force-pushed with the source `main` SHA so provenance is always one commit away.

### Upgrading between flavors is a documented manual process

There is deliberately **no tooling** to move a project between flavors. Upgrading is a manual, documented `git` process: the docs at `docs/flavors/{api,inertia}/upgrade-to-full.md` are the hand-written _inverse_ of each manifest — restore the deleted artifacts, re-add the allowed rewrites, reinstall the pruned packages. Because flavor branches are derived from `main`, every removed artifact is recoverable from the full tree; choosing a flavor is not a one-way door.

## Alternatives considered

- **Hand-maintained flavor branches** (edit the branches directly): guaranteed drift between branches, no way to verify a flavor is a strict subset of `main`, and the coupling horror of rebasing structural changes three times per PR. Rejected — hence "branches as artifacts".
- **A script with business knowledge baked in** (imperatively delete "everything CMS-like"): fragile, needs per-change maintenance, and can silently under-prune. Rejected — hence declarative manifests that fail loudly on stale entries.
- **Allow arbitrary file rewrites**: would let a flavor patch business code, turning flavors into forks that diverge semantically and break the subset guarantee. Rejected — hence the closed `REWRITE_ALLOWLIST` and `DisallowedRewriteError`.
- **Regenerating flavors from a different source than `main`** (e.g. a `main` + overlay commits): more moving parts, and the overlay commits themselves are hand-maintained branches-by-another-name. Rejected.
- **Flavor manifest merging** (resolve rewrites against the current file instead of full replacement): couples the flavor outcome to main's current file shape and to merge semantics — the opposite of reproducible. Rejected — rewrites carry the complete post-prune content.

## Consequences

Positive:

- Flavor branches are **reproducible artifacts**: regenerate from any `main` SHA and get the same tree, which makes them auditable and rebuildable on demand.
- **Adding a flavor** is just dropping a new manifest file in `tooling/prune/flavors/`; CI discovers it automatically.
- A red `main` can never leak into a flavor branch, and a stale manifest is caught by CI instead of shipping under-pruned code.
- The coupling rule keeps the codebase free of flavor-conditionals in business code: if pruning hurts, the fix lands in `main` where it helps everyone.

Costs:

- Flavor changes are two-step for maintainers: change `main`, then let CI regenerate. There is no "try it on the flavor branch" workflow.
- New code must be written to be prune-safe from the start (the rule of thumb: if it dies when the CMS dies, it lives in `app/cms/`), which is a standing constraint documented in `AGENTS.md` and the flavor index.
- Upgrading between flavors is manual by design; the trade-off is no upgrade tooling in exchange for strict artifact reproducibility.

No code changes were required to record this decision; this ADR is documentation only.
