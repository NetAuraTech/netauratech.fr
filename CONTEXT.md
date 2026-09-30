# NetAuraTech (netauratech.fr)

The NetAuraTech site: a content-driven public front (portfolio, services, contact) and an authenticated admin back-office (users, roles, permissions, files, logs, maintenance, settings), built on the Foundry 2.0 baseline (the `inertia` flavor of `adonisjs-foundry` v2.0.0) on a domain-driven backend. The public site has no CMS and no page persistence — its content is committed markdown.

## Language

### Contexts & Modules

**Admin**:
The authenticated back-office context: `/admin/*` URLs, controllers under `app/{domain}/controllers/admin/` rendering the `inertia/pages/{domain}/admin/` pages, `admin.*` route names, the `admin.json` i18n namespace. Screens: dashboard, users, roles, permissions, files, logs, maintenance, settings.
_Avoid_: CMS (this codebase has no CMS module), dashboard (a screen inside Admin, not the context)

**Front**:
The audience-facing shell context: controllers under `app/{domain}/controllers/front/`, Inertia pages under `inertia/pages/{domain}/front/`. Covers the public site (home, portfolio, project detail, services) and authenticated self-service screens (settings: profile, account, preferences). It is about _who the screen is for_, not about authentication.
_Avoid_: Public (that is the exposure axis, below), website

**Public**:
The exposure axis: the unauthenticated routes — the `core.*.render` front routes and the SEO endpoints (`sitemap.xml`, `robots.txt`) — anything reachable without a session. Orthogonal to Front: a Public route serves the Front audience, but a Front screen may still require a session.
_Avoid_: front, anonymous, guest

### Site content

> The public front is content-driven: projects and services are committed markdown files under `apps/web/content/`, parsed at request time. There is no Page model, no draft/publish state, no visual builder.

**Project**:
A single piece of development work presented publicly. A Project is one committed markdown file `content/projects/{slug}.md` (frontmatter: `order`, `cover`, `rubrique`, `title`, `note`; body: the structured story) served at `/projets/:slug` by the shared `core.projects.show.render` route and indexed in the sitemap by the projects collector. Adding a Project is dropping a file — no code change.
_Avoid_: Page (the CMS page model does not exist in this codebase), post, article, case study

**Service**:
A commercial offering with discrete items, selectable in the contact form. A Service is one committed markdown file `content/services/{slug}.md` (frontmatter: `order`, `rubrique`, `items`; body: the description, with the trailing `**Inclus** :` / `**Tarif** :` fact lines lifted out of the body). Rendered on the services page and on the home.
_Avoid_: Offer, plan, package, tier

**Project Block**:
One structural unit of a Project's story, parsed from the markdown body by `src/core/services/project_blocks.ts`: `lede`, `chapter` (each `##` heading), `features` (blank-line-separated `**Label.** body` lines), `quote` (paragraph + optional attribution), `gallery` (`id:N [| alt]` file references), `metrics` (one figure per line). The `:::` fence syntax delimits the typed blocks; text outside fences becomes the lede and chapters.
_Avoid_: Section (that is a page layout region, `inertia`/design-system `Section`), component, CMS block

**Cover**:
A Project's lead image, referenced in frontmatter as a backend file **id** (`cover: <int>`) and resolved at render time through the file domain into a server-resolved URL with responsive variants. A missing file leaves the cover unset (a placeholder renders) instead of failing the page.
_Avoid_: Hero image, thumbnail

**Sitemap Collector**:
A registered contributor of URLs to `sitemap.xml` (the `SitemapContributor` contract in `src/core/types/sitemap.ts`, registered in `start/sitemap.ts`). Two ship: the route collector (every parameter-free `core.*.render` route) and the projects collector (one `/projets/{slug}` URL per `content/projects/*.md`).
_Avoid_: Feed, index, registrar

### Files

**File**:
An uploaded asset (image, document, etc.) stored on a configured Drive disk under the `files/` namespace (no `cms/` prefix), with metadata (size, mime type, dimensions for images). The active disk is `DRIVE_DISK` (`fs`, `s3` or `r2`); the public R2 disk serves assets through the `R2_PUBLIC_URL` CDN domain.
_Avoid_: Asset, upload, media

**FileFolder**:
A nesting container for Files, supporting hierarchical organization. Deleting a FileFolder does not delete its Files or child folders — they move to root.
_Avoid_: Directory, category, album

**FileAlt**:
A named, per-locale alt-text entry for a File (keyed by file + locale + key), resolved at render time. Distinct from the inline alt override set on a gallery image reference (`id:N | alt`).
_Avoid_: Alt text (when referring to the inline override — use "alt override" for that case)

**Responsive Variant**:
A WebP rendition of an image File at one of the optimized widths (400, 800, 1200, 1600), generated next to the original by the image optimizer and addressed through the `variants` map of a resolved file. Skipped for non-images, SVGs, and widths larger than the source.
_Avoid_: Thumbnail, breakpoint

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

### Operations

**OpenAPI (API docs)**:
The runtime-generated OpenAPI 3 document of the versioned REST surface (`/api/v1/openapi.json`), scoped to the caller's permissions, plus a self-hosted interactive reference at `/api/docs` (Scalar). Both are gated by the `apiDocs` feature flag and generated from the same route/validator definitions the API serves.
_Avoid_: Swagger (the spec is OpenAPI 3), API explorer

**Background Job**:
A unit of work on a named `@adonisjs/queue` queue (Redis-backed; the `sync` driver runs it inline). Ships with the password-reset mail, the log-entry pruning, and the backup-retention jobs. Consumed by a worker process (`node ace queue:work`); with `QUEUE_DRIVER=redis` and no worker running, jobs wait in Redis.
_Avoid_: Task (a task is the schedule; a job is one enqueued execution), cron entry

**Scheduled Maintenance Task**:
A recurring job registered at boot (`start/scheduler.ts`) on the `maintenance` queue: Log Entry pruning and Backup retention enforcement. Interval is a `MAINTENANCE_*_SCHEDULE` duration string (`"0"` disables); a distributed Lock keeps a task from running twice at once.
_Avoid_: Cron, batch

**Maintenance Mode**:
A runtime toggle (admin UI or `maintenance:on`/`maintenance:off`) that serves a public maintenance page instead of the app routes. Gated by the `maintenance` feature flag: health probes (`/health`, `/health/ready`) stay reachable outside the maintenance middleware, and an IP allowlist exempts specific clients.
_Avoid_: Degraded mode, read-only mode

**Backup**:
A point-in-time PostgreSQL export (full on a scheduled day, differential otherwise), stored under the `backup/` prefix on `BACKUP_STORAGE_DISK` (which accepts the private `r2-backup` disk), gzip-compressed and AES-256-GCM-encrypted with the app key. Entirely separate from file storage; file-based, with no database table of its own.
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
The dot-notation identifier of a business or security occurrence embedded in a Log Entry's message (e.g. `invitation.sent`, `logs.pruned`, `file.deleted`, `backup.retention.scheduled_failed`). It answers "what happened"; the Actor answers "who".
_Avoid_: Action type, activity kind

**Actor**:
The User responsible for a Log Entry, persisted as first-class columns (`actor_id`, `actor_email`) so the trail survives user deletion (`ON DELETE SET NULL`).
_Avoid_: Author, initiator

**Retention**:
The pruning policy applied to Log Entries by the `logs:prune` command: entries older than the retention window are deleted, then the `persistence.maxEntries` soft cap is enforced (CNIL-aligned).
_Avoid_: Expiration, TTL (TTL belongs to cache entries)

## Example Dialogue

**Dev**: Is a Project a Page, or does it need a database row?
**Domain**: A Project is a committed markdown file under `content/projects/`, served by the shared `/projets/:slug` route. There is no Page model and no persistence — adding a Project is dropping a file.

**Dev**: Where does a Project's cover image live?
**Domain**: In the file system of the configured disk, referenced in frontmatter by its file **id**. The URL is resolved on the server through the file domain at render time — never committed to the repo, never hand-built in the front.

**Dev**: Can a Permission belong directly to a User?
**Domain**: No, only to a Role. A User's effective permissions always come through their Role.

**Dev**: Is a password reset link a session token?
**Domain**: No — it's a Token (selector/validator pattern), single-purpose and short-lived. Session/auth tokens are handled by `@adonisjs/auth`, not this Token model.

**Dev**: Is the contact form stored in the database?
**Domain**: No. It is a client-side `mailto:` form — the submission leaves through the visitor's mail client. Nothing is written to the database.
