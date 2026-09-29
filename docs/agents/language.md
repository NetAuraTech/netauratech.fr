# Language Convention

All content in this repository **must be written in English**. This applies to:

- Source code (identifiers, comments, error messages)
- Documentation (`docs/`, `README.md`, ADRs, agent guides)
- Commit messages and Conventional Commits bodies
- Issue titles, descriptions, and labels on the issue tracker
- JSDoc annotations
- Test names and assertions

## Rationale

This is an open-source project published on GitHub. English ensures the codebase remains accessible to international contributors and AI agents that process the repository.

## Exceptions

None. Even internal notes, scratch files, and temporary documentation must use English.

## i18n namespaces follow domain ownership

Translation namespaces in `resources/lang/{locale}/` mirror domain boundaries, because a flavor that drops a domain must be able to prune its file with nothing left behind:

- Each domain owns one file named after it: `identity.json`, `file.json`, `log.json`, `account.json`, `webhook.json`, `auth.json`, ...
- Admin UI strings live under the `admin.` branch **inside the domain file** (e.g. `identity.admin.users.list`) — not in a shared `admin.json` branch. `admin.json` only holds chrome shared by the whole back-office (sidebar categories, dashboard frame, ...).
- The CMS module lives in the `cms/` subfolder (`cms/page.json`, `cms/template.json`, `cms/builder.json`) so a flavor that drops the CMS prunes one directory. Builder keys are root-relative under `cms.builder.*` (e.g. `cms.builder.toolbar.publish`).
- Dashboard strings belong to the collector's own namespace (e.g. `cms.page.admin.dashboard.*`), never to a generic dashboard branch.
- Do not introduce grab-bag namespaces; a namespace that owns nothing gets deleted.
