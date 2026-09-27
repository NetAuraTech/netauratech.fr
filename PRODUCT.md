# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: prospective clients of NetAuraTech (small-business owners, association
leaders, or individuals) who arrive with an idea or an existing site and need to
judge whether NetAuraTech can build it well, then get in touch. Buyers dominate,
but the portfolio is also read by peers and future collaborators evaluating
craft rather than buying services.

## Product Purpose

The public site of NetAuraTech, a French web-development auto-entreprise
(one-person business). It proves the quality of NetAuraTech's work through a
portfolio of real projects, states the services offered, and converts visitors
into contact requests by email. Success is a credible, low-friction path from
"who is this?" to "I want to talk about a project."

## Positioning

Craft and polish-first development. The work — and the site itself — is the
evidence: close, hand-made, production-grade output by a single maker, with
direct contact to the person who does the work and no agency overhead. What a
competitor could not truthfully copy is the combination of visible, real work
and personal accountability for its quality.

## Operating Context

Monolingual French content (`resources/lang/fr/`) served to French-speaking
visitors; the repo, its docs, and its issues stay in English. The public surface
is hand-written Inertia pages with no content persistence: projects live as one
static route each (`front.*`), services as static content, and the contact form
(name, email, message, optional Service selector) is delivered by email through
a job with retry-on-failure — nothing is written to the database.

## Capabilities and Constraints

- Landing page, project pages, services grid, and contact flow; project visuals
  are served by the backend file module, not committed to the repo as images.
- Adding a project requires registering a parameter-free GET route named
  `front.*` (the sitemap collector indexes it automatically) and a controller
  rendering a hand-written Inertia page.
- Domain vocabulary is authoritative and must not drift: `Projet` (development
  work presented publicly), `Service` (commercial offering with discrete items,
  selectable in contact forms), `ContactMessage` (a visitor's request via a
  form, optionally aimed at a Service), `Technologie` (a label on a project's
  stack shown as a badge, neither hierarchical nor filterable). See `CONTEXT.md`.
- Undecided and to define, not to invent: exact project list and their write-ups;
  service tier names/wording; pricing (if any); whether testimonials are
  published; and the specific public profiles/pages featured as links.

## Brand Commitments

Name: NetAuraTech. Site content is written in French.

Confirmed visual DNA (directional commitments, from the March 2026 world
selection, kept durable because the user pinned them and steered them):

- World: the black-and-white studio language of reference site 375.studio,
  translated for a single web-developer auto-entreprise. Pure near-black
  page (`#050505`), one hot accent in the blue / mauve / violet family,
  grotesque editorial typography (Space Grotesk), hairline rules, image-led
  project section. No serif display, no ivory-paper magazine sections.
- Mode: Persuade — the landing leads with the work; the projects are the
  proof and the action is contacting the studio.
- Typography: Space Grotesk (display + interface), uppercase tracked labels,
  italic accent words inside oversize headlines. Jost stays in the tree for
  other surfaces.
- Three.js is ambient and meaningful: project plates live in WebGL space,
  drawn as typographic screens in the world's own grammar on a near-black
  ground, the scroll + pointer parallax the stack and hovers advance a plate.
  Never decorative, always the work itself; `prefers-reduced-motion` renders
  a static frame, WebGL-absent builds fall back to a DOM grid.
- Signature cursor: a round difference-blend lens ("VOIR · VOIR ·") shown on
  the project plates only.
- Palette: `#050505` ground, paper-white text, ONE saturated accent in the
  blue / mauve / violet family (currently `#8f7bff`; final hue to lock at
  build).
- Performance is credibility: the WebGL stays light and honours
  `prefers-reduced-motion`; no stock as substitute for real project shots —
  project plates are typographic until the real screenshots are supplied.

## Evidence on Hand

Real, completed projects exist to be shown, with their logos and screenshots
available to serve in the portfolio. Public GitHub and/or LinkedIn profiles
exist to link as social proof. Exact URLs, project files, and screenshots are
durable facts the user must provide; none are to be fabricated. There is no
testimonial evidence in hand; absence of published quotes is a true current
state, not an omission.

## Product Principles

- The site must itself demonstrate the craft-and-polish claim it makes; debt or
  template feel would undercut the positioning.
- Proof precedes promises: real projects and genuine engineering detail
  persuade more than descriptors.
- The buyer's path to contact must stay short, direct, and human — talking to
  the maker is the differentiator.
- Content is French, factual, and maintained by hand; add only what is true and
  can be kept current.
- Keep the surface lightweight and durable: static hand-written pages, no CMS
  persistence, honors the portfolio's role and the single-maker operating model.
