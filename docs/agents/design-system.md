# Design System Agent Guide

Component library in `inertia/components/`, organized as Atomic Design (atoms → molecules → organisms). No `templates`/`pages` folders — page-level layout lives in `inertia/pages/`. No Storybook in this project; verification is via typecheck + manual checks in the running app.

> **Flavor note:** this guide assumes a frontend tree. The `api` flavor ships no `inertia/` directory at all; the `cms/` subtree below is `full`-flavor only (the `inertia` flavor prunes it too).

## Sources

- Atomic Design, chapter 1: design systems should move work away from isolated pages and toward systems of reusable components.
- Atomic Design, chapter 2: atoms, molecules, organisms, templates, and pages are a mental model for seeing a UI as both a whole and a collection of parts.
- Atomic Design, chapter 3: a pattern library should be the living place where components are named, composed, documented, and tested.
- Atomic Design, chapter 4: interface inventories help expose duplicate patterns, naming drift, and missing shared components.
- Atomic Design, chapter 5: a design system is a living product, not a one-time style guide artifact.

## Local Shape

- `inertia/components/atoms/`: foundational UI primitives (`button.tsx`, `input.tsx`, `modal.tsx`, `card.tsx`...) plus the table primitives (`atoms/table/`).
- `inertia/components/molecules/`: small reusable compositions (`field.tsx`, `pagination.tsx`, `theme_toggle.tsx`...).
- `inertia/components/organisms/`: distinct interface sections (`header.tsx`, `footer.tsx`, `admin/`, `files/`).
- `inertia/components/cms/`: the CMS module subtree — static block renderers (`blocks/`), the page/block `renderer/`, builder overlays (`builder/`), the props-editing UI (`editor/`), plus the module's private `hooks/`, `utils/`, and `types/`. Everything here is prunable together when a flavor drops the CMS.

## Classification Rules

Use the smallest category that preserves the component's meaning.

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

## Special case: cms/blocks vs cms/editor/blocks

The 12 page-builder block types each have **two** components, deliberately separate:

- `cms/blocks/{type}_block.tsx` — static, read-only render of the block (used on the public page and in the live builder preview).
- `cms/editor/blocks/{type}_editor.tsx` — the editing UI for that block's props, used only inside the builder sidebar.

Never merge these two — rendering and editing have different concerns (the render path must stay fast and side-effect-free; the editor path owns form state and validation). Adding a new block type means adding both files.

## Naming

Match the block/domain vocabulary from `CONTEXT.md` (Block, Template, Page) rather than generic UI terms. `{type}_block.tsx` / `{type}_editor.tsx` for builder components; otherwise prefer the role over a framework category (`admin_sidebar.tsx` over `sidebar.tsx`).

## Component Creation Checklist

- Search `inertia/components/{atoms,molecules,organisms}` for an existing pattern to extend before creating a new one.
- Pick the category by responsibility, not visual size.
- Define props around content structure, not one page's current data.
- If creating a new block type, add both the block renderer and the editor, and register it wherever block types are enumerated (check `cms/builder/block_types.ts`).

## Verification

```bash
npm run typecheck
```

For UI/layout/responsive changes, verify manually in the running dev server (`npm run dev`) — there is no visual regression tooling in this project.
