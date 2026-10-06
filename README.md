# webdle — Personal Brand Websites — Project Handoff

**Status:** Demo build. A landing page plus four design directions (Prestige, Warmth, Wow, Calm), each rendered for two fictional sample clients (`jane-teacher`, `john-writer`), build successfully. No real clients, no deployment yet.
**Audience for this doc:** You (the developer) and Claude, acting as a coding assistant.
**Last updated:** 2026-10-04

---

## 1. What this business is

A service that builds personal brand websites for **teachers** and **writers**.

**Core value proposition:** When someone Googles the client's name, their personal
website is the first result — not social media profiles, school staff pages, or
unrelated people with the same name.

**Target clients:**
- Teachers who want a professional online presence for career growth, speaking,
  consulting, or publishing.
- Writers who need an author platform to showcase books, articles, and credentials.

**The problem solved:** These clients are invisible or misrepresented in search
results. They have expertise but no controlled, professional web presence. They
typically lack the technical skills and time to build and optimize a site themselves.

**Services offered:**
- Strategy: personal positioning, audience, goals
- Website: design and copywriting tailored to the profession
- SEO: name-search optimization
- Ongoing: content updates, maintenance, reputation monitoring

**Success looks like:** A client searching their own name finds their new website
at the top of results, with accurate information they are proud to share.

---

## 2. Accuracy rules — highest priority

These rules apply to all content, code, and client communication. They are the
reason several architectural decisions below exist.

1. **Never hallucinate.** Do not invent facts, statistics, quotes, dates, names,
   URLs, prices, policies, or rankings.
2. **Flag every uncertainty** with `[CHECK: ...]` so the human can verify.
3. **When in doubt, ask.** Never silently assume.
4. **Label content:**
   - `[FACT]` — verified
   - `[SUGGESTION]` — an idea, not a fact
   - `[TODO]` — must be filled in
5. **No fabricated SEO claims.** Never promise specific rankings, traffic, or
   timeframes. Phrase as strategy estimates and mark them.
6. **Client-facing drafts are `DRAFT`** until explicitly approved.
7. **Never invent** client biographies, testimonials, credentials, or publications.
8. **Never state Google's algorithm behavior as fact** unless verified.
9. **Never present guesses as answers.** Flag or ask first.

These rules are enforced in code via Zod schemas (see §6).

---

## 3. Business decisions already made

| Decision | Choice | Notes |
|---|---|---|
| Repo architecture | **Multi-tenant** (one repo, many clients) | Chosen over one-repo-per-client to allow hiring PMs later |
| Framework | **Astro** | Static output, excellent SEO, low JS by default |
| Styling | **Tailwind CSS** | Shared design tokens, per-client theming later |
| Content | **Markdown / TS config files in repo** | No CMS for POC |
| CMS | **Deferred** | Add when 3–5 clients create edit-request load, or when first PM is hired |
| Domain strategy | **`clientname.com`** per client | Fallbacks: `.net`, `.co`, positioning domain |
| Build model | **Per-client build** | `dist/[slug]/` per client, deployed to that client's domain |
| Contact form | **`[TODO: form endpoint]`** | Placeholder until service chosen (Formspree / Web3Forms / etc.) |
| Deployment | **POC on own Linux server**, production TBD | `dist/[slug]/` is a plain static folder |
| Fake personas | **Two:** `jane-teacher`, `john-writer` | Changed 2026-10-04: the content now reads like a finished site (was placeholder-shaped). The names Jane Teacher and John Writer stay obviously fictional; the town, schools, publishers and titles are invented and were searched for to avoid matching real ones; every page still says it is a sample with fictional content. Both are set in Canada (Larkmere, Ontario and Tidewick, Nova Scotia), so schools, degrees, grades and spelling follow Canadian usage. Search again before adding an invented name |
| Team plan | **Solo now, PMs later, dev steps away from code** | Drives multi-tenant + config-driven choices |

### Repo name

**`webdle`** — matches the business name. (Previously considered:
`personal-brand-sites`, chosen for being tech-neutral and surviving a business
rename; superseded now that the name is settled.)

### Business name

**`webdle`** — decided. Domain: **`webdle.ca`** (given by the owner 2026-10-04). **[CHECK]**
confirm the name is not already taken/trademarked before public launch.

---

## 4. Architecture

### Directory structure


```
webdle/
├── clients/
│   ├── jane-teacher/config.ts   # sample teacher (fictional)
│   └── john-writer/config.ts    # sample writer (fictional)
├── src/
│   ├── schemas/client.ts        # Zod schemas (§6)
│   ├── lib/
│   │   ├── clients.ts           # loads + validates every clients/*/config.ts
│   │   ├── view.ts              # direction registry + per-client view model
│   │   └── art.ts               # seeded generative SVG art (no stock photos)
│   ├── layouts/Base.astro       # html shell, JSON-LD, demo switcher
│   ├── components/DemoSwitcher.astro
│   ├── components/CalmScene.astro  # Calm only: one layered horizon (sky, sun, path on the water)
│   ├── components/ShareTags.astro  # link-preview tags (Open Graph, Twitter card, canonical) for every page
│   ├── templates/               # one full design per direction
│   │   ├── Prestige.astro  Warmth.astro  Wow.astro  Calm.astro
│   │   ├── Classic.astro        # the multi-page sample: one template, four pages (home, about, work, contact)
│   │   └── index.ts             # direction -> template map
│   ├── scripts/wow.ts           # Wow only: poster fitting, scroll (GSAP ScrollTrigger + Lenis)
│   ├── scripts/wow-press.ts     # Wow only: WebGL2 ink renderer (three plates, overprint, grain)
│   ├── scripts/page.ts          # Calm + Prestige + Warmth + landing page: smooth scroll, nav state, scroll reveals (GSAP ScrollTrigger + Lenis)
│   ├── scripts/calm.ts          # Calm only: the sun follows the scroll
│   ├── scripts/prestige.ts      # Prestige only: plate layers part on scroll, seals turn
│   ├── scripts/warmth.ts        # Warmth only: the tape takes its speed from the scroll, the strip of cut-outs slides, hero depth
│   ├── scripts/landing.ts       # Landing page only: each tile moves the way its direction does (ridges part, sun rises, inks slip)
│   └── pages/
│       ├── index.astro          # webdle landing page / demo showcase
│       ├── [direction]/[client].astro
│       ├── classic/[client]/[...page].astro   # multi-page sample: /classic/<client>/, /about/, /work/, /contact/
│       └── 404.astro            # "no page at this address", in the landing page's look
├── public/
│   ├── robots.txt               # allows everything; sample pages opt out with a noindex tag (Base.astro)
│   └── og/                      # link-preview images, made by `npm run og`
├── scripts/og.mjs               # photographs the top of each built page into public/og/
├── PRODUCT.md                   # product context for design tooling
└── astro.config.mjs
```


**Design principles:**
- `src/` is the **template** — shared across all clients.
- `clients/[slug]/` is the **only** place client-specific data lives.
- A build fails if a client's config doesn't validate against the Zod schema.
- Adding a client = running one command + filling in one file.

### Routing model

**Per-client build.** Each client is built separately to `dist/[slug]/` and
deployed to that client's domain. This matches the one-domain-per-client model
and isolates builds.

**[FACT]** Resolved for the demo (built and tested 2026-10-03): `[direction]/[client]` pages use a
real `getStaticPaths` that enumerates every direction and client from `src/lib/` (option 1
below). Everything builds together under `/<direction>/<slug>/`, which suits a single demo site.
A bad config fails the build with a Zod error (tested).

**[TODO]** Production per-client builds (`janeteacher.com/about/` with no slug prefix)
are not implemented yet. Options: filter `getStaticPaths` by a `CLIENT` env var and
strip the prefix with `BASE_PATH`, or add root-level pages. Decide when the first
real client is signed.

Original options, kept for reference:
1. Rewrite pages to use proper `getStaticPaths` that enumerates all clients.
2. Keep per-client builds but use a `BASE_PATH` env var to strip the slug prefix
   in production URLs (`janeteacher.com/about/` instead of
   `janeteacher.com/jane-teacher/about/`).

### URL structure

**Demo (built):** each design direction is a single long-scroll page per client.

- `/` — webdle landing page
- `/<direction>/<client>/` — e.g. `/prestige/jane-teacher/`, `/wow/john-writer/`
- `/classic/<client>/`, `/classic/<client>/about/`, `/work/`, `/contact/` — the multi-page sample (built 2026-10-04)
- `/404.html` — shown for any address that does not exist (built 2026-10-04)

**Contact (built 2026-10-04).** The landing page ends with a contact section (`/#contact`): the
owner's name and an email link, set in `contact` at the top of `src/pages/index.astro`. The header
links to it, and so does the demo switcher on every sample page. It is a `mailto:` link with the
address written out, not a form; the sample sites' own forms stay inert.

**Link previews (built 2026-10-04).** Every page carries Open Graph and Twitter card tags
(`src/components/ShareTags.astro`). The landing page and each `/<direction>/<client>/` has its own
1200x630 picture in `public/og/`; the Classic sub-pages share their Home picture. Sample pages say
in the preview text that they are a webdle sample with fictional content. Run `npm run og` after
changing a design or adding a client: it builds, photographs the top of each page in headless Edge
or Chrome (`scripts/og.mjs`, no extra dependencies) and writes the pictures to `public/og/` and
`dist/og/`.

Link previews need absolute URLs, which come from `site` in `astro.config.mjs`
(`https://webdle.ca`, set 2026-10-04). A deploy at any other address, such as a staging or preview
URL, should be built with `SITE_URL=https://...` so its previews and canonical links point at
itself. **[CHECK]** the previews have not been tried in a real messaging app yet; that needs the
site live at its address.

**[TODO] Production (per client):** the original plan below is not built. The demo
single-page layout may be fine for real clients, or they may want separate pages for SEO.
Decide when the first real client is signed.

- `clientdomain.com/` — home
- `clientdomain.com/about/` — bio, education, teaching/publications
- `clientdomain.com/work/` — teaching history (teacher) or writing (writer)
- `clientdomain.com/contact/` — contact form

The `/about/` page structure is modeled on the reference site
(`robyndiner.com/about/`): narrative bio → education → teaching/work history.
This is a **[FACT]** reference, not a template to copy verbatim.

### Design directions (demo)

Four full designs, one per feeling a prospect should have. All render the same client data.
A fifth sample, **Classic**, is a multi-page site rather than one long page (see below the table).

| Direction | Feeling | World | Motion |
|---|---|---|---|
| Prestige | Credibility, gravitas | Oxblood, arched plates, engraved rosettes, Bodoni Moda | The ridges or waves inside each plate part by depth as it crosses the screen; the seals are engraved line by line and turn with the page; headings rise from behind their baseline, ledger rules are drawn, books are set on the shelf one by one |
| Warmth | Warmth, personality | Sunny yellow, paper-cut collage, rounded sticker UI, Bricolage Grotesque | The hero is put together like a collage: cut-outs land on the blob one by one, the badge and sticker are pressed on, the name is underlined. On scroll, cards, notes and tiles come down onto their own shadow, stickers are slapped on, headings are set down a word at a time; the tape of titles speeds up and reverses with the scroll; the strip of cut-outs slides sideways; collage pieces shift under the pointer |
| Wow | Cutting-edge, bold | Wood-type broadside in three transparent inks (yellow, pink, blue) that overprint; Besley and League Gothic fitted to the measure | WebGL2 press: ink rolls on as you scroll, plates slip out of register with pointer and scroll speed, scroll pushes into the pink to reach the bio, the pointer pulls the inks apart where it hovers, rules and type arrive with the ink, a tape of course or publication titles runs sideways on scroll, "Print it again" re-deals the inks |
| Calm | Calm, focused | Cool off-white, four horizon scenes from dawn to dusk, the name standing on the first horizon, Spectral | The day passes with the scroll: the sun rises behind the name, stands high over the first band, sets in the second, and the moon comes up at the foot of the page; its path on the water shimmers; headings clear out of a haze, mist lifts down paragraphs, list rules are drawn in; reading-progress hairline |

The landing page shows each direction in miniature: its tiles move the way their direction does (Prestige's ridges part with the scroll, Warmth's cut-outs land and drift, Wow's inks roll on and slip out of register with the scroll and pointer, Calm's sun rises and its water shimmers), the headline rises a word at a time, and its buttons travel to the designs. On wide screens (80rem and up) the hero also holds the four designs as a fanned hand of cards, dealt on load; each card leans with the pointer and travels to its tile when clicked. Moving between pages is animated with cross-document view transitions (`src/styles/global.css`): opening a design from its tile lets the page grow out of that tile, and every other move between pages (the demo switcher, back to the landing page) is a short fade. Browsers without the feature navigate as before.

**Classic (multi-page).** Structure modelled on the reference site (`robyndiner.com`): a header with
the name, a line under it and the page links; separate Home, About (bio, then education and teaching
history in open/close boxes), Teaching or Writing, and Contact pages; a footer repeating the links.
The look is its own, not the reference's: a bound book (cloth green, gilt, marbled endpapers generated
by `marble()` in `src/lib/art.ts`, plates mounted where photographs would hang), set in Alegreya, with
headings set light then bold. It has no Workshops, Editing or Testimonials pages, since the sample
configs hold no such content and none may be invented. Going from page to page, the header holds
still, the gilt mark under the current page slides to the new one, and the page turns beneath
(`vt-turn` in `src/templates/Classic.astro`). It is listed in the demo switcher and has its own tile
on the landing page, under the four. **[TODO]** this is the closest thing yet to the production
URL structure above; decide whether real clients get this layout by default.

Imagery is generated vector art (`src/lib/art.ts`), so there are no stock-photo licences or real
people's likenesses. Real client photos can replace it later. Every animation is an enhancement over
a fully visible page and has a `prefers-reduced-motion` fallback (verified: content is visible with
JavaScript off and with reduced motion on all 8 pages).

---

---

## 5. Tech stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Astro | `^7.3.5` | Updated from README draft (`^4.15.0`); installed 2026-10-03 |
| Styling | Tailwind | `^4.3.3` | v4 via `@tailwindcss/vite` plugin (no tailwind.config) |
| Tailwind integration | `@tailwindcss/vite` | `^4.3.3` | Replaces `@astrojs/tailwind`, which is for Tailwind 3 |
| Sitemap | `@astrojs/sitemap` | not installed | [TODO] `site` is now set (`https://webdle.ca`), so this can be added |
| Validation | Zod | `^4.6.5` | Schema uses `z.url()` (Zod 4) |
| Script runner | `tsx` | not installed | [TODO] add when `scripts/*.ts` exist. `scripts/og.mjs` is plain Node and does not need it |
| Animation | `gsap` (ScrollTrigger) | `^3.15.0` | All four directions. **[CHECK]** confirm GSAP's current licence terms before commercial use |
| Smooth scroll | `lenis` | `^1.3.26` | All four directions |
| Fonts | `@fontsource*` | `^5.3.0` | Self-hosted: Bodoni Moda, Hanken Grotesk, Bricolage Grotesque, Literata, Besley, League Gothic, Spectral, Public Sans, Alegreya |
| TypeScript | `typescript` | `^5.6.0` | **[CHECK]** verify |

### Why Astro

- Static output → fast, cheap hosting, trivially SEO-friendly
- Zero JS by default → excellent Core Web Vitals without effort
- Content collections + Zod → typed content, build-time validation
- One codebase, many client sites via config

### Why Zod is critical

Zod is a TypeScript library for defining the **shape** of data and validating it
at build time. In this project:

- A "client bio" has a defined shape (`name`, `bio`, `credentials`, etc.)
- If a client config is missing a required field, the build **fails** with a
  clear error
- This encodes the accuracy rules (§2) as code, not discipline
- A teacher cannot ship without at least one credential; a writer cannot ship
  without at least one publication
- TypeScript gets full autocomplete on client data

### Why no CMS yet

A CMS lets non-technical clients edit content. Reasons to defer:

- POC has no real clients
- Adding a CMS now is premature infrastructure
- **The fear that a CMS loses the client is misplaced** — the CMS handles trivial
  edits; the business sells strategy, positioning, SEO, reputation, and hosting.
  A CMS frees the developer to sell more of that, not less.
- Add a CMS when: (a) 3–5 clients create edit-request load, or (b) first PM is
  hired and needs to operate without the developer

**CMS options for later:** Decap CMS or TinaCMS (git-based) or Sanity / Payload
(headless). Both keep the Astro frontend and SEO setup intact.

**[SUGGESTION]** — this is a strategic recommendation, not a fact.

---

## 6. Zod schema

File: `src/schemas/client.ts`

```ts
import { z } from 'zod';

const CommonFields = {
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, hyphens only'),
  name: z.string().min(2),
  domain: z.string().url(),
  tagline: z.string().min(10).max(140),
  location: z.string().optional(),
  /** Verified external profiles only. No placeholders, no guesses. */
  sameAs: z.array(z.string().url()).default([]),
};

const CredentialSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  degree: z.string().min(2),
  institution: z.string().min(2),
  location: z.string().optional(),
});

const TeachingRoleSchema = z.object({
  startYear: z.number().int().min(1900),
  /** null = ongoing */
  endYear: z.number().int().min(1900).nullable(),
  role: z.string().min(2),
  institution: z.string().min(2),
  department: z.string().optional(),
  courses: z.array(z.string()).default([]),
});

const PublicationSchema = z.object({
  title: z.string().min(1),
  venue: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  url: z.string().url().optional(),
  type: z.enum(['book', 'article', 'essay', 'story', 'chapter']),
});

export const TeacherSchema = z.object({
  ...CommonFields,
  archetype: z.literal('teacher'),
  bio: z.string().min(100),
  credentials: z.array(CredentialSchema).min(1, 'teacher requires at least one credential'),
  teaching: z.array(TeachingRoleSchema).min(1, 'teacher requires at least one teaching role'),
  publications: z.array(PublicationSchema).default([]),
});

export const WriterSchema = z.object({
  ...CommonFields,
  archetype: z.literal('writer'),
  bio: z.string().min(100),
  credentials: z.array(CredentialSchema).default([]),
  publications: z.array(PublicationSchema).min(1, 'writer requires at least one publication'),
  teaching: z.array(TeachingRoleSchema).default([]),
});

export const ClientSchema = z.discriminatedUnion('archetype', [
  TeacherSchema,
  WriterSchema,
]);

export type Client = z.infer<typeof ClientSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type Writer = z.infer<typeof WriterSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type TeachingRole = z.infer<typeof TeachingRoleSchema>;
export type Publication = z.infer<typeof PublicationSchema>;