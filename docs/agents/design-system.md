# Design System Agent Guide

The shared React design system. Presentation **tokens** and (eventually) reusable **components** live in the `@foundry/design-system` workspace at `packages/design-system/`; the app consumes it as a workspace dependency. This is a **source-only** package — it ships no build output, and every consumer's bundler compiles it from source.

> **Flavor note:** the design-system is a frontend concern. It is kept by the `full` and `inertia` flavors (both ship a React front) and pruned wholesale by the `api` flavor (headless, no frontend). The `api` flavor ships no `packages/` directory at all.

## The `@foundry/design-system` package

- **Source-only, no build.** Consumers add `@foundry/design-system` to their `dependencies` and import it directly; the bundler resolves the linked package to its TypeScript source. There is no `main`/`dist` — the `exports` map is the public API.
- **The `exports` map is the public API.** One subpath per public component plus `./tokens` — components and tokens only. **The package is bound to Inertia by design** (`@inertiajs/react` is a hard dependency): thin router primitives (`Link`, `Head`) with fully injected props are tolerated, but the package ships no hooks, no route resolution, no active-state detection and no data loading — every such value crosses the boundary as a prop. Active-state detection for nav links lives in the app (`apps/web/inertia/hooks/use_nav_link_active.ts`) and reaches the `header` / `admin_sidebar` organisms through their `isActive` link/entry props. Add a subpath when a component or token module becomes public; keep one folder per component under `src/{atoms,molecules,organisms}/`.
- **Presentation tokens are the package's type surface.** `src/tokens.ts` holds the shared presentation types (the Tailwind font-size scale, paragraph variants and spacing). Relocate new shared presentation types here rather than leaving them in the app — never duplicate a token definition in the app.
- **`tailwind-variants` is the styling primitive.** One `tv()` call per component, typed variant props, built-in `className` merging. All package components (atoms and molecules) use it.
- **React 19 is a peer dependency**, hoisted to a single copy shared with the app.

## Canonical CSS

The design tokens, custom variants, utilities and font loading live in the package's canonical entry, `packages/design-system/src/css/canonical.css`. This is **Storybook's** copy of the design system.

The app keeps its own **full** copy at `apps/web/inertia/css/app.css` as the **theme-override surface**: it carries the same canonical block (so the app can restyle it) **plus** the app-only annexes (`@source` for the app tree, `@layer base`, `@layer components`). The app **never imports the package's CSS**; instead it adds an `@source` pointing at the package source through a real relative path (not the `node_modules` symlink) so Tailwind scans the package's class names. Keep the two canonical blocks in lockstep when a token changes.

Font loading is declared as CSS `@import`s (in both the package's canonical CSS and the app copy), not as JS imports.

## Boundary

The package is a **consumer, never a depender**, of the app. It must not import app modules — not through a `#*` alias (the package has none) and not through a relative escape to `apps/` or `tooling/`. This is enforced two ways:

1. **Resolution gate** — the package's `tsconfig`/bundler cannot resolve the app's aliases, so any such import fails typecheck.
2. **Lint gate** — a repo-wide, path-scoped `no-restricted-imports` override fails fast on any package→app import (see `oxlint.config.ts`).

Consumption is workspace-dep only — no bundler aliases point into the package.

## Storybook

Storybook is a **package devDependency** and runs **locally only**: `npm run storybook --workspace @foundry/design-system`. There is no root script and no CI job for it. Stories live next to components as `*.stories.tsx` and are picked up by `.storybook/main.ts`.

## App-embedded components

The app's React components live in `inertia/components/`, organized as Atomic Design (atoms → molecules → organisms). No `templates`/`pages` folders — page-level layout lives in `inertia/pages/`.

The move of components into the package is in progress: all generic atoms, the `auth_intro`, `banner`, `field`, `image_picker` and `pagination` molecules, and the `header`, `footer` and `admin` organisms (`admin_header`, `admin_main`, `admin_sidebar`) already live in the package. The app keeps what is workflow- or app-coupled: the `theme_toggle` and `auth_providers` molecules, the `file_image` / `file_upload_input` atoms, and the `settings`, `file manager` and CMS builder organisms.

> **Flavor note:** the `inertia/components/cms/` subtree is `full`-flavor only (the `inertia` flavor prunes it too; the `api` flavor prunes the whole `inertia/` tree).

Package molecules are **100% props/children**: app data reaches them through injected query functions and render props (e.g. `ImagePicker` receives a `loadFile` query and a `renderFileManager` surface; `Pagination` receives resolved label strings and a `buildHref` callback; `Field` receives a `sanitizeValue` function, a `renderImage` extension point, and — through the validation seam — a `validation` bundle typed by the structural `FieldValidation` interface plus the Inertia `errors` record). The package owns no app data, no API endpoint and no i18n catalog.

### Field validation seam

`Field` accepts two optional props that move the repeated per-field validation wiring out of call sites:

- `validation` — the app's `useFormValidation` instance, matched against the package's structural `FieldValidation` interface (`handleChange`, `handleBlur`, `getValidationMessage`, `getHelpClassName`, all optional). The package never imports the app's hook type — any structurally compatible object is accepted.
- `errors` — the full Inertia `errors` record from the `Form` render-prop closure, passed as-is.

When present, `Field` wires its own `name` into the bundle's change/blur handlers (value is `e.target.checked` for `checkbox`/`radio`, `e.target.value` otherwise), displays `errors[name]` first and `getValidationMessage(name)` as a fallback, and applies `getHelpClassName(name)` to the help text when `helpText` is present. Explicit `onChange`, `onBlur`, `errorMessage`, and `helpClassName` props always win — fields with custom handlers (LFW, builder editors, cross-field re-validation) keep them and are otherwise untouched.

### Atoms

Use `atoms` for components that cannot be broken down further without losing their UI purpose.

Good atom signals:

- Wraps or standardizes a primitive element: button, link, checkbox, table, icon.
- Encodes visual language: logo, tag, panel, highlight, error code.
- Has broad applicability and no product workflow knowledge.
- Accepts content and state through props or slots instead of fetching or deciding app behavior.

Avoid atom bloat. If the component starts orchestrating several atoms into a specific task, it is probably a molecule.

### Molecules

Use `molecules` for simple groups of atoms that function together as one portable pattern.

Good molecule signals:

- Combines atoms into a small task: field, select field, article card, pagination, dialog.
- Has one clear responsibility and can be dropped into several places.
- Makes atoms useful in context, but does not own a whole page section.
- May expose events and slots, but should avoid app-specific data loading.

If a molecule needs many named regions, repeated child patterns, or section-level layout, consider an organism.

### Organisms

Use `organisms` for distinct interface sections.

Good organism signals:

- Represents a recognizable section: top bar, footer, newsletter form.
- Composes molecules and atoms into a larger unit.
- Can include repeated molecule instances.
- Defines section-level layout and interaction while staying reusable.

An organism may contain private child components inside its folder. Export only the public component through `package.json`.

### Special case: cms/blocks vs cms/editor/blocks

The 17 page-builder block types each have **two** components, deliberately separate:

- `cms/blocks/{type}_block.tsx` — static, read-only render of the block (used on the public page and in the live builder preview).
- `cms/editor/blocks/{type}_editor.tsx` — the editing UI for that block's props, used only inside the builder sidebar.

Never merge these two — rendering and editing have different concerns (the render path must stay fast and side-effect-free; the editor path owns form state and validation). Adding a new block type means adding both files.

## Naming

Match the block/domain vocabulary from `CONTEXT.md` (Block, Template, Page) rather than generic UI terms. `{type}_block.tsx` / `{type}_editor.tsx` for builder components; otherwise prefer the role over a framework category (`admin_sidebar.tsx` over `sidebar.tsx`).

## Component Creation Checklist

- Search `packages/design-system/src/` first (atoms and generic molecules live there), then `inertia/components/{atoms,molecules,organisms}`, for an existing pattern to extend before creating a new one.
- Pick the category by responsibility, not visual size.
- Define props around content structure, not one page's current data.
- If creating a new block type, add both the block renderer and the editor, and register it wherever block types are enumerated (check `cms/builder/block_types.ts`).

## Verification

```bash
npm run typecheck
npm run lint
```

For UI/layout/responsive changes, verify manually in the running dev server (`npm run dev`); for package components, Storybook is the fast local check. There is no visual regression tooling in this project.
