---
name: NetAuraTech
description: Web developer studio site — deep black, editorial grotesque, one electric-mauve accent.
colors:
  ground: 'oklch(0.15 0.012 292)'
  paper: 'oklch(0.948 0.012 88)'
  paper-deep: 'oklch(0.912 0.015 88)'
  ink: 'oklch(0.22 0.015 292)'
  ink-muted: 'oklch(0.52 0.02 292)'
  ink-paper-dim: 'oklch(0.948 0.012 88 / 0.5)'
  ink-paper-faint: 'oklch(0.948 0.012 88 / 0.4)'
  accent: 'oklch(0.56 0.21 296)'
  accent-soft: 'oklch(0.7 0.16 296)'
  accent-deep: 'oklch(0.46 0.2 296)'
  hairline: 'oklch(0.62 0.025 292 / 0.4)'
  hairline-soft: 'oklch(0.62 0.025 292 / 0.18)'
  hairline-tile: 'rgba(255,255,255,0.10)'
typography:
  display:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: 'clamp(2.7rem, 8vw, 6.5rem)'
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  headline:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: 'clamp(2rem, 5vw, 4rem)'
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  title:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: 'clamp(2rem, 6vw, 4.7rem)'
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 'normal'
  label:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: '0.25em'
    textTransform: 'uppercase'
components:
  cta-ghost:
    border: '1px solid oklch(0.948 0.012 88 / 0.4)'
    color: 'oklch(0.948 0.012 88)'
    textColor-hover: 'oklch(0.7 0.16 296)'
    padding: '14px 28px'
    textTransform: 'uppercase'
  plate-title:
    color: 'oklch(0.948 0.012 88)'
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: 'clamp(2rem, 6vw, 4.7rem)'
---

# Design System: NetAuraTech

## Overview

**Creative North Star: "The Precision Atelier"**

NetAuraTech is a web development atelier, and its site speaks the atelier's language: a deep black ground, a precise editorial grotesque, a single color accent — electric mauve — and the work shown large. The identity borrows the black-and-white vocabulary of award-winning studios (reference: 375.studio): the page stays black, typography carries almost everything, and project imagery fills the screen.

The system is deliberately monochrome plus one accent. Black is not a neutral backdrop but the material of the atelier; paper white exists only as ink on black; electric mauve appears only for emphasized title words, sign-bullets, index numbers and hovers. Light (ivory) sections are banned: the entire surface lives on the canvas black `oklch(0.15 0.012 292)`.

The density is airy and editorial: large clamp-sized titles with tight negative tracking, 0.25em-spaced micro-links, 1px hairlines separating elements instead of shadowed cards. Verticality matters: each project piece occupies a full screen (~86vh), edge-to-edge landscape image, title overlaid at the bottom.

**Key Characteristics:**

- Pure atelier-black ground (`oklch(0.15 0.012 292)`), one color accent per screen.
- Editorial grotesque (Space Grotesk), enormous tight titles, accented emphasized words.
- Work first: full-size project plates, image + overlaid title.
- Flat depth: hairlines and tonal layers, never drop shadows.
- Signature magnifying-glass cursor over the project plates.
- Atelier marquee (scrolling craft sections).
- Refined by construction: no ivory, no serif display, no text gradients.

## Colors

Atelier palette: a deep black as material, paper white as ink, ONE electric-mauve accent — and nothing else. Every tile is written in `oklch` in the theme.

### Primary

- **Electric mauve** (`oklch(0.7 0.16 296)`, soft — the accent in use): emphasized words in titles, the sign-bullets `■`, index numbers, link hovers and the magnifying cursor. It is THE life signal in the black.
- **Deep electric mauve** (`oklch(0.46 0.2 296)`, deep): the fill of the rare fully-colored surfaces (followed-CTA chips) where text must stay legible (contrast ≥ 4.5) — e.g. the legacy bordeaux CTA history.
- **Mid electric mauve** (`oklch(0.56 0.21 296)`, accent): emphasized words in large text (≥3:1); never in small text on light grounds.

### Neutral

- **Atelier black** (`oklch(0.15 0.012 292)` — the page ground, the shipped `--color-canvas`): the very material of the page.
- **Plate black** (`oklch(0.15 0.012 292)` with tints `#0b0b0d / #101014`): surface variants for WebGL plates and fallback cards.
- **Paper ink** (`oklch(0.948 0.012 88)`, paper): text on black.
- **Dimmed paper ink** (`paper / 0.5`, `/ 0.6`, `/ 0.7`): body copy, notes, captions.
- **Faint paper ink** (`paper / 0.4`): purely decorative / visual-noise elements.
- **Hairline** (`paper / 0.40`, the shipped `--color-edge`): tile separators, plate borders, list rules. The soft variant (`paper / 0.18`, the shipped `--color-edge-strong`) and the tile-grid hairline (`white / 0.10`) round out the line vocabulary.

### Named Rules

**The One-Accent Rule.** A single color accent carries any given surface. Electric mauve is never used on more than ~10% of a screen; its rarity is its strength.

**The No-Ivory Rule.** No section — aside from an accessible fallback sheet — goes light ivory. The whole page lives on the canvas black; white is only ink.

## Typography

**Display Font:** Space Grotesk (fallback: sans-serif)
**Body Font:** Space Grotesk (fallback: sans-serif)

**Character:** Space Grotesk carries the front content end to end — the modern editorial grotesque that recalls contemporary studio work. Hierarchy is built with size, weight and case, never with a change of family. Emphasized words in titles receive the electric-mauve accent. Cormorant Garamond appears only in the header wordmark and the external nav-link variant; the app base font (admin surfaces, form fields) is Jost.

### Hierarchy

- **Display** (400, `clamp(2.7rem, 8vw, 6.5rem)`, `1.02`): the front-page hero title, tracking `-0.03em`, balanced.
- **Headline** (400, `clamp(2rem, 5vw, 4rem)`, `1.02`): section titles, tracking `-0.03em`.
- **Title** (500, `clamp(2rem, 6vw, 4.7rem)`, `1.02`): titles overlaid on project plates, tracking `-0.02em`.
- **Body** (400, `1rem` → `1.125rem` on md, `1.625`): editorial text, ~65ch max column.
- **Label** (400, `0.6875rem`, tracking `0.25em`, uppercase): micro-labels "Projects", rubrics, indexes, plate footers.

### Named Rules

**The One-Face Rule.** A single family (Space Grotesk) carries the front language. No serif display in the front content (Cormorant Garamond is confined to the wordmark and external nav links), no "technical" mono, no platform sans.

**The Accent-Emphasis Rule.** A word in a title that needs emphasis receives the electric-mauve accent; that is the only use of emphasis. Space Grotesk ships no true italic face, so where an accent word is set italic it is a synthetic slant paired with the accent color.

## Layout

Sober grid system: container max `6xl` for editorial text, `1600px` width for project plates. Padding `16px` mobile / `64px` desktop (px-5 / md:px-16).

- **Editorial vertical rhythm:** py-20→28 (sections), py-28→40 (contact), project plates `62vh` mobile / `86vh` desktop full width.
- **Density:** generous air between titles and body (mt-10/14), maximally spaced micro-links and labels.
- **Sections** : the page alternates black headers, a 1px curved marquee, then scrolled sections. The tile grid uses `gap-px` on a `white/10` ground to create the "hairline between tiles" effect.
- **Responsive** : plates 86vh → 62vh, 3-column grids → 1 column, clamp-sized titles (from mobile up).

## Elevation & Depth

**Flat by default.** Depth is NOT carried by shadows. It comes from three mechanisms: 1px hairlines (`white/10`, `paper/0.40`) that cut the planes; tonal black layers (page `oklch(0.15 0.012 292)` vs plates `#0b0b0d`/`#101014`); and the readability gradient over images (`to-b from-black/75 via-black/20`). The ambient WebGL lays down a very light drift of mauve motes — atmosphere, not elevation.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat at rest. No drop shadow dresses a card, a button or a tile; the only "lift" is the hover (scale + shade shift).

## Shapes

The system is square and sharp: the atelier does not work in rounded corners. Crisp edges (radius 0), signal squares `■` (1×1 → 2×2 rem) as bullets and signs, straight hairlines. Only the magnifying cursor is round (a non-retained element).

## Components

### Buttons (CTA ghost)

- **Shape:** crisp edges, `1px solid paper/0.40`, radius 0, padding `14px 28px`, uppercase tracking `0.18em`.
- **Primary CTA:** ghost border + mauve `→` arrow; on hover the text turns electric mauve and the border follows.
- **Hover / Focus:** shade and color shifts, never a shadow or a lift; `:focus-visible` outline `2px accent` on the border.

### Chips / Tags

- **Style:** text `paper/0.50` uppercase `0.2em` (never pills).

### Cards / Containers

- **Corner Style:** square (radius 0).
- **Background:** page black or plate tints `#0b0b0d` / `#101014`.
- **Border:** hairline `white/10`.
- **Shadow Strategy:** none — hairlines and tonal layers.
- **Internal Padding:** `32px` mobile, `40px` desktop (`p-8 md:p-10`).

### Project Plates (signature component)

- **Layout:** one piece = a full screen `62–86vh`, full width, landscape image (`2000×1200`, served by the backend file module) in `object-cover`, zoom `1.04` on hover.
- **Overlay:** clamp-sized title `2rem→4.7rem` at bottom-left, `N° — Rubric` above it, project note at bottom right; gradient `from-black/75 via-black/20 to-transparent` for readability.
- **Cursor:** magnifying-glass "Découvrir" (difference blend) resting on the plate.

### Navigation (front)

- **Style:** fixed, `canvas/70` ground + `backdrop-blur`, Space Grotesk logo, nav links uppercase `0.2em` `paper/70` → `paper` on hover; `current` in electric mauve. Mobile burger, full-screen black menu.

### Ambient WebGL (signature)

- Field of mauve motes (`#8f7bff`, AdditiveBlending, ~110 points) drifting behind the hero and the project showcase. Atmosphere only; `prefers-reduced-motion` → a lighter static pattern (40 points); no WebGL → plain black hero. The showcase rows additionally run a WebGL distortion pass over their images (the DOM `<img>` stays as the SSR / reduced-motion / no-WebGL fallback).

## Do's and Don'ts

### Do:

- **Do** compose every new surface from the existing components (`atoms` / `molecules` / `organisms`) rather than recreating elements from scratch; if no component covers the need and the element is reusable, create a component.
- **Do** keep the page on the canvas black — ivory is only ink (see The No-Ivory Rule).
- **Do** keep the electric-mauve accent rare: emphasized words, indexes, hovers, the magnifier.
- **Do** give project work its full height: one piece = one image-led full screen.
- **Do** express depth with hairline + tonal layer, never with shadow.
- **Do** use Space Grotesk alone, in clamps, tight tracking, accented emphasized words.

### Don't:

- **Don't** use light grounds / ivory sections on the public surface.
- **Don't** add a second accent or a text gradient.
- **Don't** set the mid accent in small text on light grounds (contrast < 4.5).
- **Don't** fabricate screenshots: plate and gallery visuals are served by the backend file module (database files), and that must stay visible.
- **Don't** let the WebGL ornament the content: motes only, frozen under `prefers-reduced-motion`.
