# AdonisJS Foundry

A production-ready boilerplate and headless CMS: authentication, an admin panel with a visual page builder, file management, and a template system, built on a domain-driven backend.

## Language

### Contexts & Modules

**Flavor**:
A surface variant of the codebase — `full` (the `main` branch: Inertia front + admin + CMS module), `inertia` (front + admin, no CMS) and `api` (headless REST, no front). The `inertia` and `api` branches are CI-regenerated artifacts of `main`, produced by the declarative prune manifests in `tooling/prune/flavors/`; they are never edited by hand. Flavor variation is confined to the allowlisted config/composition/docs files — any code only one flavor has belongs in a prunable module (the CMS module, the webhook module).
_Avoid_: edition, tier, branch (the branch is the vehicle, the flavor is the concept)

**Admin**:
The authenticated back-office context: `/admin/*` URLs, controllers under `{domain}/admin/`, `admin.*` route names, the `admin.json` i18n namespace. Exists in every flavor, independently of the CMS module.
_Avoid_: CMS (the old name of this context before ADR-0001; `cms` now names only the CMS module), dashboard (a screen inside Admin, not the context)

**CMS module**:
The prunable vertical slice of content management — Page, Template, page builder, Contact — living in the `src/cms/` business module (actions, services, repositories, models, exceptions) and the `app/cms/` transport module (controllers, routes, nav, validators, transformers, REST resources), plus the co-located per-domain units (`database/{migrations,seeders,factories}/cms/`, `resources/lang/{en,fr}/cms/`, `inertia/{pages,components}/cms/`, `tests/{unit,integration,functional}/cms/`, …). Absent from the `inertia` and `api` flavors. Rule of thumb: if it dies when the CMS dies, it lives in the CMS module.
_Avoid_: back-office, admin panel (those are the Admin context, which survives every flavor)

**Front**:
The audience-facing shell context: controllers under `{domain}/front/`, Inertia pages under `{domain}/front/`. Covers public content rendering (Pages, Contact) and authenticated self-service screens (account, profile, preferences) — it is about _who the screen is for_, not about authentication. Exists in the front flavors (full, inertia); the headless `api` flavor prunes the front context entirely.
_Avoid_: Public (that is the exposure axis, below), website

**Public**:
The exposure axis: unauthenticated route modules and feature flags (the CMS public front registered by `#transport/cms/routes`, the future `publicApi` flag) — anything reachable without a session. Orthogonal to Front: a Public route serves the Front audience, but a Front screen may still require a session. (Front flavors — the headless `api` flavor has no public site routes.)
_Avoid_: front, anonymous, guest

### Content

> **(full flavor)** The terms below belong to the CMS module — Page, PageTranslation, PageRevision, Block and
> Template are pruned from the `inertia` and `api` flavor branches.

**Page**:
A publishable unit in the CMS, identified by its `defaultLocale` and an optional homepage flag. A Page owns one or more PageTranslations and has no content of its own — all renderable content lives on its translations.
_Avoid_: Article, post, document

**PageTranslation**:
The locale-specific content of a Page: slug, title, meta fields, block tree, and publish status (draft/published/archived). A Page has exactly one PageTranslation per locale.
_Avoid_: Translation, locale version, page content

**PageRevision**:
A saved snapshot of a PageTranslation's content, created automatically before every update. A PageRevision can be restored or pinned (kept) to exclude it from auto-purge.
_Avoid_: Version, history entry, backup (this is unrelated to the Backup system)

**Block**:
A single node in a PageTranslation's content tree (one of 17 types: section, grid, flex, title, paragraph, button, separator, icon, form, field, htmltext, image, video, carousel, list, quote, iframe). Container blocks (section, grid, flex, form, carousel) can hold child Blocks. Embeddable blocks (video, iframe) are governed by the embed policy (`embed_policy`), configured via `CMS_VIDEO_PROVIDERS` / `CMS_IFRAME_ALLOWLIST` and enforced both at save time (sanitization) and render time (PageResolverService).
_Avoid_: Component, widget, element

**Template**:
A reusable, saved Block tree — either a full `page` template (an entire layout) or a `block` template (a single pre-configured Block). Distinct from a PageRevision: a Template is intentionally saved for reuse, a Revision is an automatic safety snapshot.
_Avoid_: Layout, preset, snippet

### Collaboration (Page Builder)

> **(full flavor)** The terms below belong to the CMS page builder — Builder Session, Lock and
> Draft are pruned from the `inertia` and `api` flavor branches.

**Builder Session**:
A user's active editing presence on a specific PageTranslation, tracked in the cache (Redis) with a TTL, not in the database. Ends on disconnect or timeout.
_Avoid_: Connection, editing state

**Lock**:
A short-lived (5s, heartbeat-renewed) claim on a single field of a Block within a Builder Session, preventing two editors from overwriting the same field simultaneously. Always scoped to one field, never a whole Block or Page.
_Avoid_: Mutex, claim, reservation

**Draft**:
The in-progress, unsaved content of a PageTranslation being edited live, kept in cache so late-joining editors see current state. Distinct from a PageRevision (a saved, persisted snapshot) and from the PageTranslation's own `content` column (the last persisted version).
_Avoid_: Autosave, working copy

### Files

**File**:
An uploaded asset (image, document, etc.) stored on a configured Drive disk under the `cms/` prefix, with metadata (size, mime type, dimensions for images).
_Avoid_: Asset, upload, media

**FileFolder**:
A nesting container for Files, supporting hierarchical organization. Deleting a FileFolder does not delete its Files or child folders — they move to root.
_Avoid_: Directory, category, album

**FileAlt**:
A named, per-locale alt-text entry for a File (keyed by file + locale + key), resolved at render time. Distinct from an inline alt override set directly on a Block's image props.
_Avoid_: Alt text (when referring to the inline override — use "alt override" for that case)

### Auth & Access

**User**:
An account in the system, with a Role, optional OAuth provider links, and a verification state (unverified/verified/pending invite).
_Avoid_: Account, member (Account is reserved for the settings area: credentials, not identity)

**Role**:
A named collection of Permissions assigned to Users. System roles cannot be modified or deleted.
_Avoid_: Group, team

**Permission**:
A single grantable capability (slug-based, e.g. `users.create`), assigned to Roles via a many-to-many pivot. Never assigned directly to a User.
_Avoid_: Right, scope, ability

**Token**:
A short-lived credential following the selector/validator pattern (plain-text selector for lookup, hashed validator for verification), used for password reset, email verification, email change, and pending invites. Never a session or auth token — those are handled separately by `@adonisjs/auth`.
_Avoid_: Code, OTP, link token

**Invitation**:
The admin-driven flow of creating a passwordless User and sending them a PENDING*INVITE Token to set their own password and activate the account.
_Avoid_: Onboarding, signup link

**Two-Factor (2FA)**:
The optional TOTP second factor on a User. Enrollment (from Settings → Account) stores a cipher-protected TOTP secret; once enabled, login requires a 6-digit TOTP code or an unused Recovery Code after the password check, before any session exists. Disabling requires the current password plus a valid code.
_Avoid_: MFA (the system implements exactly one second-factor type), OTP (a code is an instance, not the feature)

**Recovery Code**:
A one-time credential, generated in a batch when 2FA is enabled and shown exactly once, usable in place of a TOTP code at login. Entering one consumes it permanently.
_Avoid_: Backup token, reset token (those are selector/validator Tokens)

### Webhooks (full flavor)

> The terms below belong to the inbound-webhook module — pruned from the `inertia` and `api` flavor branches.

**Webhook Delivery**:
A single inbound, HMAC-signed `POST /webhooks/:receiver`. Verified by `X-Signature` (hex HMAC-SHA256 of `${X-Timestamp}.${rawBody}`) against the shared secret, bounded by a replay window, and recorded idempotently in `webhook_deliveries` (deduplicated by `X-Delivery-Id` or a payload digest). A worker job then advances it `pending → processed/failed`. The `202` response acknowledges receipt, not processing.
_Avoid_: Event (that is the Log Entry event slug), notification, inbound payload

### Operations

**OpenAPI (API docs)**:
The runtime-generated OpenAPI 3 document of the versioned REST surface (`/api/v1/openapi.json`), scoped to the caller's permissions, plus a self-hosted interactive reference at `/api/docs`. Both are gated by the `apiDocs` feature flag and generated from the same route/validator definitions the API serves — the rollout tests guard against spec drift.
_Avoid_: Swagger (the spec is OpenAPI 3), API explorer

**Background Job**:
A unit of work on a named `@adonisjs/queue` queue (Redis-backed; the `sync` driver runs it inline). Ships with the password-reset mail, inbound-webhook delivery processing, and the scheduled maintenance tasks. Consumed by a worker process (`node ace queue:work`); with `QUEUE_DRIVER=redis` and no worker running, jobs wait in Redis.
_Avoid_: Task (a task is the schedule; a job is one enqueued execution), cron entry

**Scheduled Maintenance Task**:
A recurring job registered at boot (`start/scheduler.ts`) on the `maintenance` queue: Log Entry pruning and Backup retention enforcement. Interval is a `MAINTENANCE_*_SCHEDULE` duration string (`"0"` disables); a distributed Lock keeps a task from running twice at once.
_Avoid_: Cron, batch

**Maintenance Mode**:
A runtime toggle (admin UI or `maintenance:on`/`maintenance:off`) that serves a public maintenance page instead of the app routes. Gated by the `maintenance` feature flag: health probes (`/health`, `/health/ready`) stay reachable outside the maintenance middleware, and an IP allowlist exempts specific clients.
_Avoid_: Degraded mode, read-only mode

**Backup**:
A point-in-time database export (full or differential), stored on a Drive disk under the `backup/` prefix — entirely separate from CMS file storage and from PageRevisions.
_Avoid_: Snapshot, dump (when referring to the feature as a whole; "dump" is fine for the literal `pg_dump` step)

**Rate Limit (API)**:
The per-client budget applied to every authenticated `/api/v1/*` route: keyed by the authenticated user id, allowing `user.apiRateLimit` requests per minute with `API_RATE_LIMIT_DEFAULT` as the fallback. Distinct from per-route throttles, which key on the IP for guest surfaces.
_Avoid_: Throttle (the per-route limiter), quota

### Logging & Audit

**Log Entry**:
A single persisted row of the audit trail (`log_entries` table), written by `LogService` alongside its usual pino output (write-through). Carries a Level, a Category, a Message, an optional Actor, and a JSON context.
_Avoid_: Audit record, event row

**Category**:
The broad classification of a Log Entry (`auth`, `api`, `database`, `security`, `performance`, `business`, `system`), deciding both its admin tab and its persistence/retention rules. Security and business entries are always persisted.
_Avoid_: Channel, stream

**Event (slug)**:
The dot-notation identifier of a business or security occurrence embedded in a Log Entry's message (e.g. `page.published`, `user.invited`, `logs.pruned`). It answers "what happened"; the Actor answers "who".
_Avoid_: Action type, activity kind

**Actor**:
The User responsible for a Log Entry, persisted as first-class columns (`actor_id`, `actor_email`) so the trail survives user deletion (`ON DELETE SET NULL`).
_Avoid_: Author, initiator

**Retention**:
The pruning policy applied to Log Entries by the `logs:prune` command: entries older than the retention window are deleted, then the `persistence.maxEntries` soft cap is enforced (CNIL-aligned).
_Avoid_: Expiration, TTL (TTL belongs to cache entries)

## Example Dialogue

**Dev**: Should this saved layout be called a Template or a Revision?
**Domain**: Template — it's intentionally saved for reuse. A Revision is the automatic snapshot taken before every edit; the developer doesn't choose to create one.

**Dev**: Is the Draft the same as the PageTranslation's content?
**Domain**: No. The Draft is the live, unsaved in-progress state held in cache during editing. The PageTranslation's `content` column only updates once the edit is actually saved.

**Dev**: Can a Permission belong directly to a User?
**Domain**: No, only to a Role. A User's effective permissions always come through their Role.

**Dev**: Is a password reset link a session token?
**Domain**: No — it's a Token (selector/validator pattern), single-purpose and short-lived. Session/auth tokens are handled by `@adonisjs/auth`, not this Token model.

**Dev**: Is the user-management screen part of the CMS?
**Domain**: No. It belongs to the Admin context — the authenticated back-office that exists in every flavor. The CMS module is only the prunable content vertical (Page, Template, builder, Contact); user management survives when the CMS module is pruned.
