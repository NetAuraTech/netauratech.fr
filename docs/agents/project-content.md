# Project Content Blocks

How a project's story is structured in `content/projects/{slug}.md` so each
part of a single-project page can be designed individually instead of one
block of text. The source is plain markdown; `SiteContentService` →
`parseProjectBlocks` (`app/domain/services/core/project_blocks.ts`) turns the
body into an ordered list of typed blocks that the `ProjectBlocks` dispatcher
(`inertia/components/molecules/project_block/`) renders with one layout per
type.

## Frontmatter

Every project source opens with the required YAML frontmatter:

| Field      | Type   | Purpose                                            |
| ---------- | ------ | -------------------------------------------------- |
| `order`    | number | Display position in the portfolio (unset = last).  |
| `cover`    | number | Backend file id served as the project cover image. |
| `rubrique` | string | Project category, e.g. `Application web`.          |
| `title`    | string | Project title.                                     |
| `note`     | string | One-line description shown on the plate.           |

## Body → blocks

The body is markdown. Two ways to produce blocks:

**Default mapping — no fence needed.** The text before the first `##` heading
becomes a `lede` block (rendered at a larger scale); every `## Heading` opens
a `chapter` block (oversize heading + markdown body). This alone gives the
story an editorial flow.

**Fenced blocks.** A line `:::type` opens a typed block and a line `:::` closes
it. Fenced blocks insert in flow order, between the freeform markdown, so a
story can alternate prose with grids, quotes, and galleries freely. Unknown
fence types and empty blocks are dropped silently.

## Block reference

### `:::lede`

Explicit lede. The default mapping already creates one from the intro; use the
fence only to force the ordering around other blocks.

```md
:::lede
Un boilerplate de référence pour lancer rapidement des applications
production-ready avec AdonisJS v7.
:::
```

### `:::features`

A hairline-tiled grid. Each blank-line-separated paragraph that starts with a
`**Label.**` becomes one tile: the label rendered as a mauve-dotted kicker,
the rest of the paragraph as its body. Paragraphs without a bold lead become
label-less tiles.

```md
:::features
**Solidité.** Une architecture domain-driven stricte, des contrôleurs fins qui
déléguent aux services.

**Complétude.** Authentification complète avec OAuth, CMS visuel par blocs et
RBAC granulaire.
:::
```

### `:::quote`

An oversized pull quote. The first paragraph is the quote; an optional second
paragraph after a blank line is the attribution (a leading `---` or `—` is
stripped).

```md
:::quote
Le code se lit comme une intention métier, sans raccourci architectural.

--- AdonisJS Foundry
:::
```

### `:::gallery`

A grid of landscape shots. One backend file per line, referenced by id:
`id:N` or `id:N | alt text`. The `ProjectController` resolves every id through
the `FindFileAction` and passes the render-ready file props to the Inertia
view, so the front renders them with `<FileImage>`. Lines that are not a file
reference are dropped silently.

```md
:::gallery
id:3 | Panneau d'administration de Foundry
id:8
:::
```

### `:::metrics`

A row of key figures. One figure per non-empty line, each rendered as an
indexed hairline tile.

```md
:::metrics
15 ms de temps de réponse moyen
Laravel 12 · PHP 8.2 · Preact
:::
```

## Adding a new block type

1. Extend the `ProjectBlock` union in `app/types/site_content.ts`.
2. Parse the new fence in `app/domain/services/core/project_blocks.ts`.
3. Add a renderer under `inertia/components/molecules/project_block/` and
   register it in the dispatcher (`index.tsx`).
4. Document the block here and cover the parser in
   `tests/unit/services/core/project_blocks.spec.ts`.
