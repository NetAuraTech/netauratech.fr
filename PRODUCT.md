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
is hand-written Inertia pages with no content persistence: projects and
services live as committed markdown under `apps/web/content/` (one file each,
no database), the portfolio is one parameterized route
(`core.projects.show.render`) and the sitemap collectors index everything
automatically, and the contact form (name, email, service selector, message)
is a client-side `mailto:` form — nothing is written to the database.

## Capabilities and Constraints

- Landing page, project pages, services grid, and contact flow; project visuals
  are served by the backend file module, not committed to the repo as images.
- Adding a project is dropping a markdown file in `apps/web/content/projects/`
  — the shared `core.projects.show.render` route and the projects sitemap
  collector pick it up with no code change.
- Domain vocabulary is authoritative and must not drift: `Project` (development
  work presented publicly, one committed markdown file), `Service` (commercial
  offering with discrete items, selectable in contact forms), `Cover` (the
  project's lead image, referenced by a backend file id). See `CONTEXT.md`.
- Undecided and to define, not to invent: exact project list and their write-ups;
  service tier names/wording; pricing (if any); whether testimonials are
  published; and the specific public profiles/pages featured as links.

## Brand Commitments

Name: NetAuraTech. Site content is written in French.

Confirmed visual DNA (directional commitments, from the March 2026 world
selection, kept durable because the user pinned them and steered them):

- World: the black-and-white studio language of reference site 375.studio,
  translated for a single web-developer auto-entreprise. Pure near-black
  page (`oklch(0.15 0.012 292)`), one hot accent in the blue / mauve / violet
  family, grotesque editorial typography (Space Grotesk), hairline rules,
  image-led project section. No serif display in the front content (the
  wordmark and external nav links use Cormorant Garamond), no ivory-paper
  magazine sections.
- Mode: Persuade — the landing leads with the work; the projects are the
  proof and the action is contacting the studio.
- Typography: Space Grotesk (display + interface), uppercase tracked labels,
  italic accent words inside oversize headlines. Jost stays in the tree for
  other surfaces.
- Three.js is ambient and meaningful: a field of mauve motes drifts behind the
  hero and the project showcase, and the showcase rows run a WebGL distortion
  pass over their images (the DOM `<img>` is the SSR / reduced-motion /
  no-WebGL fallback). Never decorative, always atmosphere around the work;
  `prefers-reduced-motion` renders a static frame, WebGL-absent builds fall
  back to plain DOM.
- Signature cursor: a round difference-blend lens ("Découvrir") shown on the
  project plates only.
- Palette: near-black ground (`oklch(0.15 0.012 292)`), paper-white text, ONE
  saturated accent in the blue / mauve / violet family — locked at electric
  mauve; the ambient motes keep `#8f7bff`.
- Performance is credibility: the WebGL stays light and honours
  `prefers-reduced-motion`; no stock as substitute for real project shots —
  project plates are image-led, served by the backend file module.

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
