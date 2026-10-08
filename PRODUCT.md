# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Teachers and writers who want a professional personal website, evaluating webdle as a possible provider. They view demo sites to judge whether webdle can build something they would want for themselves. They typically lack the time and technical skill to build and optimise a site on their own. The demo viewer is the prospective client, not the client's eventual audience.

## Product Purpose
webdle builds personal brand websites for teachers and writers so that searching their name surfaces their own site with accurate information they are proud of. The demo sites exist to win prospective clients' interest. Success is a prospect reaching out after seeing them. Confirmed for now: finish good-looking demos, then see who is interested before building further.

## Positioning
Purpose-built for two professions (teachers, writers) with profession-specific structure (credentials, teaching history, publications) and name-search setup built in. Services: strategy, design and copy, name-search setup, ongoing maintenance.

## Operating Context
Static Astro 7 + Tailwind 4 site, client content in typed config files validated by Zod at build time. Demo hosts all sample clients under `/<slug>/`. Demos are not yet deployed; deployment target is undecided (own Linux server for the POC).

## Capabilities and Constraints
- Content must come from structured client config; nothing in a real client site is invented.
- Demo personas are fictional (`jane-teacher`, `john-writer`); no real people's photos or likenesses.
- Imagery approach confirmed: generated, original visuals (SVG/CSS art, textures, typography-as-image). No stock photos for now (licensing).
- Contact forms on the sample sites are not connected (no endpoint). webdle's own contact page is `/contact/`: a Web3Forms form plus the owner's email (Thiha Min Thein), configured in `src/lib/contact.ts`.
- No rankings, traffic or timeline promises anywhere in copy.

## Brand Commitments
Business name: webdle. Binding visual constraints volunteered by the user: build four distinct design directions, one each for prestige and credibility, warmth and personality, "wow" cutting-edge, and calm and focused; steer toward soft and human, and editorial and literary looks.

## Evidence on Hand
No real clients, testimonials, case studies, press, or photography exist. Do not fabricate any. Only the two fictional sample configs in `clients/`, whose people, places, schools, publishers and titles are all invented and labelled as fictional on every page.

## Product Principles
1. Show, don't claim: the demos are the pitch, so they must look like finished sites a client would be proud of.
2. Accuracy over polish theatre: samples are clearly fictional; copy never invents facts, rankings or credentials.
3. Profession-specific beats generic: structure and tone should reflect how teachers and writers present themselves.
4. Fast and findable: static, lightweight pages with solid SEO groundwork are part of the offer.

## Accessibility & Inclusion
WCAG AA contrast and keyboard accessibility. Every animation has a `prefers-reduced-motion` alternative.
