---
name: NetAuraTech
description: Site studio de développeur web — noir profond, grotesque éditorial, un accent mauve électrique.
colors:
  ground: 'oklch(0.15 0.012 292)'
  ground-solid: '#050505'
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
    fontFamily: 'Space Grotesk, Inter, sans-serif'
    fontSize: 'clamp(2.7rem, 8vw, 6.5rem)'
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  headline:
    fontFamily: 'Space Grotesk, Inter, sans-serif'
    fontSize: 'clamp(2rem, 5vw, 4rem)'
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  title:
    fontFamily: 'Space Grotesk, Inter, sans-serif'
    fontSize: 'clamp(2rem, 6vw, 4.7rem)'
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Space Grotesk, Inter, sans-serif'
    fontSize: '1rem'
    fontWeight: 300
    lineHeight: 1.625
    letterSpacing: 'normal'
  label:
    fontFamily: 'Space Grotesk, Inter, sans-serif'
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
    fontFamily: 'Space Grotesk, Inter, sans-serif'
    fontSize: 'clamp(2rem, 6vw, 4.7rem)'
---

# Design System: NetAuraTech

## Overview

**Creative North Star: "L'Atelier de Précision"**

NetAuraTech est un atelier de développement web, et son site parle dans la langue de l'atelier : fond noir profond, grotesque éditorial précis, un seul accent coloré — le mauve électrique — et le travail mis en avant en grand. L'identité s'inspire du langage noir-blanc des studios primés (référence : 375.studio) : la page reste noire, la typographie porte presque tout, et les images des projets emplissent l'écran.

Le système est volontairement monochrome + un accent. Le noir n'est pas un fond neutre mais la matière de l'atelier ; le blanc papier n'existe que pour le texte dans le noir ; le mauve électrique n'apparaît que pour les mots italiques des titres, les puces-signes, les numéros d'index et les survols. Les sections à fond clair (ivoire) sont bannies : la surface entière vit sur `#050505`.

La densité est aérée et éditoriale : gros titres clampés serrés en tracking négatif, micro-liens espacés 0.25em, hairline 1px qui séparent les éléments plutôt que des cartes à ombres. La verticalité importe : chaque œuvre de projet occupe un plein écran (~86vh), image landscape plein bord, titre superposé en bas.

**Key Characteristics:**

- Fond d'atelier noir pur (`#050505`), un seul accent couleur par écran.
- Grotesque éditorial (Space Grotesk), titres énormes serrés, mots italiques accentués.
- Le travail d'abord : plaques projets plein-grandeur, image + titre superposé.
- Profondeur plate : hairlines et calques tonaux, jamais d'ombres portées.
- Curseur loupe signature sur les plaques et éléments interactifs.
- Marquee d'atelier (rubriques du métier défilant).
- Retenu par construction : pas d'ivoire, pas de serif display, pas de gradient texte.

## Colors

Palette d'atelier : un noir profond comme matière, un blanc papier pour l'encre, UN accent mauve électrique — et rien d'autre. Toutes les tuiles s'écrivent en `oklch` dans le thème.

### Primary

- **Mauve électrique** (`oklch(0.7 0.16 296)`, soft — l'accent à l'usage) : les mots italiques dans les titres, les puces-signes `■`, les numéros d'index, les survols de liens et le curseur loupe. C'est LE signal de vie dans le noir.
- **Mauve électrique profond** (`oklch(0.46 0.2 296)`, deep) : le remplissage des rares surfaces colorées pleines (touch suivis), où le texte doit rester lisible (contraste ≥ 4.5) — ex. l'historique des CTA bordeaux à l'ancienne.
- **Mauve électrique médian** (`oklch(0.56 0.21 296)`, accent) : mots italiques en grand texte (≥3:1) ; jamais en petit texte sur fond clair.

### Neutral

- **Noir d'atelier** (`#050505` — ground de la page, `oklch(0.15 0.012 292)` pour les variantes) : la matière même de la page.
- **Noir plaque** (`oklch(0.15 0.012 292)` et teintes `#0b0b0d / #101014`) : variantes de surface pour plaques WebGL et cartes de repli.
- **Encre papier** (`oklch(0.948 0.012 88)`, paper) : texte sur noir.
- **Encre papier atténuée** (`paper / 0.5`, `/ 0.6`, `/ 0.7`) : corps, notes, légendes.
- **Encre papier faible** (`paper / 0.4`) : éléments purement décoratifs/noise visuel.
- **Hairline** (`paper / 0.10`) : séparateurs de tuiles, bordures de plaques, règles de lists.

### Named Rules

**The One-Accent Rule.** Un seul accent coloré porte une surface donnée. Le mauve électrique n'est jamais utilisé sur plus de ~10 % d'un écran ; sa rareté fait sa force.

**The No-Ivory Rule.** Aucune section — sauf feuille de repli accessible — ne passe en fond clair ivoire. La page entière vit sur `#050505` ; le blanc n'est que de l'encre.

## Typography

**Display Font:** Space Grotesk (fallback: Inter, sans-serif)
**Body Font:** Space Grotesk (fallback: Inter, sans-serif)

**Character:** Une seule famille, utilisée d'un bout à l'autre — le grotesque éditorial moderne qui rappelle le travail des studios contemporains. La hiérarchie se fait par taille, graisse et casse, jamais par changement de famille. Les mots italiques signalent l'emphase ET reçoivent l'accent mauve.

### Hierarchy

- **Display** (400, `clamp(2.7rem, 8vw, 6.5rem)`, `1.02`): le titre de une en haut de page, tracking `-0.03em`, balance.
- **Headline** (400, `clamp(2rem, 5vw, 4rem)`, `1.02`): titres de section, tracking `-0.03em`.
- **Title** (500, `clamp(2rem, 6vw, 4.7rem)`, `1.02`): titres superposés sur plaques projets, tracking `-0.02em`.
- **Body** (300, `1rem` → `1.125rem` sur md, `1.625`): textes éditoriaux, colonne ~65ch max.
- **Label** (400, `0.6875rem`, tracking `0.25em`, uppercase): micro-étiquettes « Projets », rubriques, index, pieds de plaque.

### Named Rules

**The One-Face Rule.** Une seule family (Space Grotesk) porte tout le langage. Pas de serif display, pas de mono « technique », pas de plateforme-sans.

**The Italic-Accent Rule.** Un mot en italique dans un titre reçoit automatiquement l'accent mauve électrique; c'est le seul usage de l'emphase italique.

## Layout

Système de grille sobre : container max `6xl` pour le texte éditorial, hambre `1600px` pour les plaques projets. Padding `16px` mobile / `64px` desktop (px-5 / md:px-16).

- **Nœud vertical éditorial** : py-20→28 (sections), py-28→40 (contact), plaques projets `62vh` mobile / `86vh` desktop pleine largeur.
- **Densité** : air généreux entre titres et corps (mt-10/14), micro-liens et labels espacés maximol.
- **Sections** : la page alterne headers noirs, une marquee cintrée 1px, puis sections scrollées. La grille de tuiles utilise `gap-px` sur fond `white/10` pour créer l'effet « hairline entre tuiles ».
- **Responsive** : plaques 86vh → 62vh, grilles 3 colonnes → 1 colonne, titres clampés (dès mobile).

## Elevation & Depth

**Flat par défaut.** La profondeur n'est PAS portée par des ombres. Elle vient de trois mécanismes : les hairlines 1px (`white/10`, `paper/0.40`) qui découpent les plan ; les calques tonaux de noir (page `#050505` vs plaques `#0b0b0d`/`#101014`) ; et le dégradé de lisibilité sur les images (`to-b from-black/75 via-black/20`). Le WebGL ambient dépose une dérive de motes mauves très légère — de l'atmosphère, pas de l'élévation.

### Named Rules

**The Flat-At-Rest Rule.** Les surfaces sont plates au repos. Aucune ombre portée n'habille une carte, un bouton ou une tuile ; le seul « levé » est le survol (échelle + nuance).

## Shapes

Le système est carré et net : l'atelier ne travaille pas aux arrondis. Bords franches (radius 0), carrés de signal `■` (1×1 → 2×2 rem) comme puces et signes, hairlines droites. Seul le curseur loupe est rond (élément non-retenti).

## Components

### Buttons (CTA ghost)

- **Shape:** bords franches, `1px solid paper/0.40`, radius 0, padding `14px 28px`, uppercase tracking `0.18em`.
- **Primary CTA:** bordure ghost + flèche `→` mauve ; au survol le texte passe en mauve électrique, la bordure suit.
- **Hover / Focus:** changement de nuance et de couleur, jamais d'ombre ni de lift ; `:focus-visible` outline `2px accent` sur la bordure.

### Chips / Tags

- **Style:** texte `paper/0.50` uppercase `0.2em` (jamais de pilules).

### Cards / Containers

- **Corner Style:** carrés (radius 0).
- **Background:** noir page ou plaques `#0b0b0d` / `#101014`.
- **Border:** hairline `white/10`.
- **Shadow Strategy:** aucun — hairlines et calques tonaux.
- **Internal Padding:** `32px` mobile, `40px` desktop (`p-8 md:p-10`).

### Project Plates (signature component)

- **Layout:** une œuvre = un plein écran `62–86vh`, pleine largeur, image landscape (`2000×1200`, servie par le module fichiers backend) en `object-cover`, zoom `1.04` au survol.
- **Overlay:** titre titre-clamp `2rem→4.7rem` en bas-gauche, rubrique `N° — Rubrique` au-dessus, note de projet à droite bas; desgradé `from-black/75 via-black/20 to-transparent` pour la lisibilité.
- **Curseur:** loupe « VOIR · VOIR · » (différence blend) posée sur la plaque.

### Navigation (front)

- **Style:** fixe, fond `canvas/70` + `backdrop-blur`, logo Space Grotesk, nav links uppercase `0.2em` `paper/70` → `paper` au hover; `current` en mauve électrique. Burgers mobile, menu plein-charge noir.

### Ambient WebGL (signature)

- Champ de motes mauves (`#8f7bff`, AdditiveBlending, ~110 points) dérivant dans le héros. Atmosphère seulement; `prefers-reduced-motion` → trame statique; WebGL absent → héros noir simple.

## Do's and Don'ts

### Do:

- **Do** composer chaque nouvelle surface à partir des composants existants (`atoms` / `molecules` / `organisms`) plutôt que de recréer des éléments from scratch ; si aucun composant ne couvre le besoin et que l'élément est réutilisable, crée un composant.
- **Do** garder la page sur `#050505` — l'ivoire n'est que de l'encre (voir The No-Ivory Rule).
- **Do** laisser l'accent mauve électrique rare : mots italiques, indexes, survols, loupe.
- **Do** donner aux travaux des projets toute la hauteur : une œuvre = un plein écran image-led.
- **Do** exprimer la profondeur par hairline + calque tonal, jamais par ombre.
- **Do** utiliser Space Grotesk seul, dans les clamps, tracking serré, mots italiques accentués.

### Don't:

- **Don't** utiliser des fonds clairs / sections ivoire sur la surface publique.
- **Don't** ajouter un second accent ou un dégradé texte.
- **Don't** mettre l'accent médian en petit texte sur fond clair (contraste < 4.5).
- **Don't** fabriquer des captures d'écran : les visuels des plaques et des galeries sont servis par le module fichiers backend (fichiers de la base), et ça doit rester visible.
- **Don't** laisser le WebGL orner le contenu : motes uniquement, `prefers-reduced-motion` figé.
