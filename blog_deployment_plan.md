# zerodowntime.dev — Blog Deployment Plan

A staged plan to stand up a technical blog modeled on [yegor256.com](https://www.yegor256.com), deployed at **zerodowntime.dev**. The order matters: each phase produces something verifiable on its own, so we never have to debug ten things at once.

---

## 0. Source-of-truth: what we're modeling

Before writing any code, capture what yegor256.com actually is so we don't drift:

- **Generator**: Jekyll 4.3 (direct, *not* the `github-pages` gem). This unlocks arbitrary plugins but requires us to build the site in CI rather than letting GitHub Pages build it natively.
- **Markdown / highlighter**: Kramdown (GFM input mode) + Rouge for syntax highlighting.
- **Permalinks**: `/:year/:month/:day/:title.html`.
- **Pagination**: 16 posts per page at `p/:num` via `jekyll-paginate`.
- **Feed**: custom `rss.xml` at the root (in addition to `jekyll-feed`).
- **Excerpts**: split on the `<!--more-->` marker.
- **Layout vibe**: minimalist black-on-white, serif body type, hamburger top nav (no traditional sidebar), profile photo + social icon row in the header, post listings showing date / word count / reading time / comment count.
- **Plugins observed in `_config.yml`**: `jekyll-feed`, `jekyll-paginate`, `jekyll-sitemap`, `jekyll-redirect-from`, `jekyll-bits`, `jekyll-shorts`, `jekyll-gist`, `jekyll-plantuml`, `jekyll-git-hash`, `jekyll-chatgpt-translate`.
- **Comments**: Disqus.
- **Quality gates**: `html-proofer`, `w3c_validators`, `rubocop`, `scss_lint`.
- **Containerization**: a `Dockerfile` for reproducible builds.

We will adopt the *style* and *feature set*, not copy the source verbatim — both because we should respect the original and because some of his plugins (PlantUML, ChatGPT translate) are overkill for a starting blog.

---

## Phase 1 — Toolchain & local development environment

**Goal:** `bundle exec jekyll serve` renders an empty-but-valid site at `http://localhost:4000`.

1. **Pin Ruby** with `.ruby-version` (e.g. `3.3.5`). Use `rbenv` or `mise` so contributors don't drift.
2. **Initialize Bundler**: `bundle init`, then add to `Gemfile`:
   ```ruby
   source 'https://rubygems.org'
   gem 'jekyll', '~> 4.3'
   gem 'kramdown-parser-gfm', '~> 1.1'
   gem 'rouge', '~> 4.5'

   group :jekyll_plugins do
     gem 'jekyll-feed',          '~> 0.17'
     gem 'jekyll-sitemap',       '~> 1.4'
     gem 'jekyll-seo-tag',       '~> 2.8'
     gem 'jekyll-paginate',      '~> 1.1'
     gem 'jekyll-redirect-from', '~> 0.16'
     gem 'jekyll-archives',      '~> 2.3'  # for /tag/* and /category/* index pages
     gem 'jekyll-last-modified-at', '~> 1.3'
   end

   group :development, :test do
     gem 'html-proofer', '~> 5.0'
     gem 'rubocop',      '~> 1.75', require: false
   end
   ```
3. **Add a `Rakefile`** with three tasks: `rake build` (jekyll build), `rake test` (htmlproofer over `_site`), `rake serve` (live reload). This becomes the single entry point for both dev and CI.
4. **`.gitignore` already covers** `_site/`, `.jekyll-cache/`, `.jekyll-metadata`, `.bundle/`, `vendor/` — keep as-is.
5. **Optional but recommended: `Dockerfile`** so the build is reproducible across machines and matches CI.

**Exit criterion:** local server boots; visiting `/` shows an empty index.

---

## Phase 2 — Site config & directory skeleton

**Goal:** the conventional Jekyll layout exists and `_config.yml` is fully populated.

1. **`_config.yml`** — the file that drives everything. Key entries:
   ```yaml
   title: Zero Downtime
   tagline: Notes on building systems that don't fall over
   description: >-
     Technical writing on distributed systems, reliability, and operational
     excellence by Dr. Nobel Khandaker.
   url: https://zerodowntime.dev
   author:
     name: Dr. Nobel Khandaker
     email: nobel@intramotev.com
   markdown: kramdown
   highlighter: rouge
   kramdown:
     input: GFM
     syntax_highlighter: rouge
     hard_wrap: false
   permalink: /:year/:month/:day/:title.html
   excerpt_separator: <!--more-->
   paginate: 16
   paginate_path: /p/:num
   timezone: America/New_York
   plugins:
     - jekyll-feed
     - jekyll-sitemap
     - jekyll-seo-tag
     - jekyll-paginate
     - jekyll-redirect-from
     - jekyll-archives
     - jekyll-last-modified-at
   jekyll-archives:
     enabled: [tags, categories]
     layouts:
       tag: tag
       category: category
     permalinks:
       tag: /tag/:name/
       category: /category/:name/
   defaults:
     - scope: { path: '', type: 'posts' }
       values:
         layout: post
         comments: true
   exclude: [Gemfile, Gemfile.lock, Rakefile, README.md, blog_deployment_plan.md, vendor, node_modules]
   ```
2. **Create directory skeleton**: `_layouts/`, `_includes/`, `_sass/`, `_posts/`, `_drafts/`, `assets/css/`, `assets/js/`, `assets/img/`, `pages/`.
3. **Add `404.html`** at the root with `permalink: /404.html` so GitHub Pages serves it for missing routes.

**Exit criterion:** `bundle exec jekyll build` succeeds with zero warnings.

---

## Phase 3 — Layouts, includes, and the design system

**Goal:** visual parity with yegor256.com using our own assets.

1. **Layouts** (`_layouts/`):
   - `default.html` — wraps `<head>`, header, `{{ content }}`, footer. Calls `{% seo %}` and `{% feed_meta %}`.
   - `post.html` — extends `default`. Renders title, date, reading time, word count, body, related posts, comments include.
   - `page.html` — extends `default`. Plain content wrapper.
   - `home.html` — paginated post list with excerpts and "Continue…" links.
   - `tag.html` / `category.html` — used by `jekyll-archives` for `/tag/foo/` and `/category/bar/`.
2. **Includes** (`_includes/`): `head.html`, `header.html` (logo, hamburger nav, social row), `footer.html`, `post-meta.html` (date · words · reading time · comments), `comments.html`, `analytics.html`, `social-icons.html`, `pagination.html`.
3. **Sass** (`_sass/` + `assets/css/main.scss`):
   - One reset + variables file (colors, type scale, breakpoints).
   - Typography first: pick a serif (e.g. Source Serif 4 or PT Serif) for body and a mono (e.g. JetBrains Mono) for code. Yegor uses traditional serif body — we'll match that register.
   - Constrain content width to ~700px for readability; full-bleed code blocks.
   - Single accent color used sparingly for links.
4. **Reading-time helper**: a tiny `_includes/reading-time.html` that computes `{{ content | number_of_words | divided_by: 200 }}` minutes (200 wpm is the common heuristic). Shows next to date.

**Exit criterion:** dropping a sample post in `_posts/` produces a page that visually reads like yegor256.com — minimalist, serif, content-first.

`★ Insight ─────────────────────────────────────`
Yegor's site has *no traditional sidebar*. This is a deliberate content-first choice: every pixel competes with the prose. When you build the layout, resist the urge to add a sidebar "for navigation" — categories/tags belong on dedicated index pages reached from the top nav, not in the reading view.
`─────────────────────────────────────────────────`

---

## Phase 4 — SEO

**Goal:** every page ships correct metadata for search engines and social cards.

1. **`jekyll-seo-tag`** — drop `{% seo %}` in `<head>`. Provides `<title>`, description, canonical URL, Open Graph, and Twitter Card tags from `_config.yml` and front-matter.
2. **`jekyll-sitemap`** — auto-generates `/sitemap.xml`. No config needed.
3. **`robots.txt`** at the root:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://zerodowntime.dev/sitemap.xml
   ```
4. **Per-post front-matter** schema we'll standardize on:
   ```yaml
   ---
   layout: post
   title: "Title in title case"
   date: 2026-04-21 09:00:00 -0400
   description: "150–160 char meta description that's not just a copy of the title."
   image: /assets/img/posts/2026-04-21-slug.png   # for OG/Twitter cards
   tags: [reliability, postgres]
   categories: [systems]
   ---
   ```
5. **JSON-LD `Article` schema** — add a small include `_includes/schema-article.html` that emits `application/ld+json` on post pages with `headline`, `datePublished`, `dateModified` (via `jekyll-last-modified-at`), `author`, `image`, `mainEntityOfPage`. Google rewards this for article-style content.
6. **Canonical domain enforcement** — the `url:` in `_config.yml` plus the GitHub Pages custom-domain setup (Phase 11) avoid duplicate-content penalties between `zerodowntime.dev` and any `*.github.io` mirror.
7. **Verification** — after launch, claim the domain in Google Search Console and Bing Webmaster Tools using a DNS TXT record, then submit `/sitemap.xml`.

**Exit criterion:** running https://search.google.com/test/rich-results on a deployed post shows a valid Article result.

---

## Phase 5 — Search

Yegor's site doesn't ship a visible search box, but you asked for one. For a static site there are three realistic patterns; pick one:

| Approach | What it is | Pros | Cons |
|---|---|---|---|
| **Lunr.js (recommended start)** | Build a JSON index at compile time, search client-side | Zero infra cost, fully static, works offline | Index size grows with post count (fine up to ~500 posts) |
| **Pagefind** | Modern static-site search; postprocesses `_site` and ships fragmented WASM index | Excellent UX, lazy-loads index chunks, scales further than Lunr | Adds a Node build step |
| **Algolia DocSearch** | Hosted search service | Best quality, instant | External dependency, requires application/approval |

**Recommended path: Pagefind** for technical content because of the better fragment-based result UX and clean keyboard nav. Implementation:

1. Add `pagefind` to a `package.json` dev dependency.
2. Run `npx pagefind --site _site` after `jekyll build` (wire it into the Rakefile so `rake build` does both).
3. Drop the Pagefind UI snippet in `_includes/search.html` and link it from the header.
4. Add `data-pagefind-body` to the article container in `post.html` so only post content (not nav chrome) gets indexed.

**Exit criterion:** typing in the search box returns post titles and excerpts with hit highlighting.

---

## Phase 6 — RSS / feed

1. **`jekyll-feed`** auto-emits `/feed.xml` — link it from `<head>` via `{% feed_meta %}` (which `seo-tag` does not do, hence the separate include).
2. **Add a visible RSS icon** in the header social row.
3. **Optional**: a JSON Feed (`/feed.json`) for modern readers — generate via a small custom layout.

**Exit criterion:** `/feed.xml` validates at https://validator.w3.org/feed/.

---

## Phase 7 — Comments

Three viable choices; pick by tradeoff:

| Option | Hosting | Cost | Trade-off |
|---|---|---|---|
| **Disqus** (yegor's choice) | Hosted SaaS | Free w/ ads, paid ad-free | Heavyweight JS, privacy concerns, ads on free tier |
| **giscus** | GitHub Discussions | Free | Commenters need GitHub accounts; great for technical audience |
| **utterances** | GitHub Issues | Free | Same as giscus; older, less actively maintained |

**Recommended: giscus.** It fits a technical blog's audience, has no tracking, and keeps comment data inside your repo's GitHub Discussions where it stays portable.

**Implementation**: enable Discussions on the repo, install the giscus app, paste the generated `<script>` snippet into `_includes/comments.html`, gate it on `{% if page.comments %}`.

---

## Phase 8 — Analytics

Pick one, not all three:

- **Plausible** (recommended) — privacy-friendly, GDPR-safe, no cookie banner needed, ~1KB script. Self-hostable or $9/mo.
- **GoatCounter** — free for personal sites, similar privacy stance.
- **Google Analytics 4** — free, most data, but invasive and requires a cookie banner under EU/UK law.

Wire whichever you pick into `_includes/analytics.html`, gate it on `jekyll.environment == "production"` so local builds don't inflate stats.

`★ Insight ─────────────────────────────────────`
The `jekyll.environment` check matters: by default `JEKYLL_ENV` is `development`. CI builds for production must set `JEKYLL_ENV=production` (we'll do this in the GitHub Actions workflow in Phase 12). Without that, your analytics snippet quietly never ships.
`─────────────────────────────────────────────────`

---

## Phase 9 — Code highlighting & math

1. **Rouge** is configured via `_config.yml` (already done in Phase 2). Add a Rouge stylesheet — pick a theme (e.g. `github`, `monokai`, `base16.solarized.light`) and write it to `assets/css/syntax.css`:
   ```bash
   bundle exec rougify style github > assets/css/syntax.css
   ```
   Then `@import` it from `main.scss`.
2. **Math support** — for a technical blog this matters. Use **KaTeX** over MathJax (smaller, faster, server-side renderable). Add KaTeX's CSS + JS to `_includes/head.html`, conditionally on `{% if page.math %}` so non-math pages don't pay the cost.
3. **Mermaid diagrams** (optional) — load `mermaid.js` conditionally on `{% if page.mermaid %}` for flowcharts and sequence diagrams.

---

## Phase 10 — Quality gates & local checks

1. **`html-proofer`** — already in the Gemfile. Add a Rake task:
   ```ruby
   task :test => :build do
     require 'html-proofer'
     HTMLProofer.check_directory('./_site',
       disable_external: false,
       enforce_https: true,
       check_html: true,
       allow_missing_href: false
     ).run
   end
   ```
   Catches dead links, missing alt text, broken anchors. Run before every push.
2. **`rubocop`** for any custom Ruby plugins under `_plugins/`.
3. **`stylelint`** (Node) for SCSS — lighter than `scss_lint` and actively maintained.
4. **Markdown lint** with `markdownlint-cli2` to keep post formatting consistent.

---

## Phase 11 — Custom domain (zerodowntime.dev)

**Goal:** the site responds at `https://zerodowntime.dev` with valid HTTPS.

1. **Buy/transfer domain** to a registrar (Namecheap, Cloudflare Registrar, Porkbun). `.dev` is a Google-operated TLD on the HSTS preload list — **HTTPS is mandatory** out of the gate, you cannot serve plain HTTP even briefly.
2. **DNS setup** — at the registrar (or Cloudflare if proxying), add either:
   - Apex (`zerodowntime.dev`) → four GitHub Pages A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and AAAA records for IPv6 if desired).
   - Or use ALIAS/ANAME → `nobelk.github.io` if your registrar supports it (cleaner, but not all do).
   - `www.zerodowntime.dev` → CNAME → `nobelk.github.io`.
3. **Add `CNAME` file** at the repo root containing exactly `zerodowntime.dev` (no protocol, no trailing newline-issues). GitHub Pages reads this on build.
4. **In GitHub repo Settings → Pages**: set custom domain to `zerodowntime.dev`, wait for DNS check to pass, then enable **"Enforce HTTPS"**. (For `.dev` this isn't optional anyway — HSTS preload will block plain HTTP.)
5. **Decision**: keep using `nobelk.github.io` as the repo, or rename to `zerodowntime` and use the project-pages model? Recommendation: **rename or create a new repo** named after the project (e.g. `zerodowntime-blog`) so the user-pages slot stays free for a separate landing page. Project pages with a custom domain work identically once `CNAME` is set.

`★ Insight ─────────────────────────────────────`
The `.dev` TLD's mandatory-HTTPS via HSTS preload is a real constraint, not a recommendation: browsers refuse to load `http://zerodowntime.dev` even before any DNS resolution happens. If GitHub Pages hasn't issued the cert yet (it can take up to 24h after DNS propagates), the site will be **unreachable**, not just downgraded. Plan the DNS cutover with that window in mind.
`─────────────────────────────────────────────────`

---

## Phase 12 — CI/CD with GitHub Actions

**Why we can't use GitHub Pages' built-in Jekyll**: Pages whitelists a small set of plugins. `jekyll-archives`, `jekyll-last-modified-at`, Pagefind's Node step, etc. won't run there. The fix is to build ourselves and push the artifact.

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }   # jekyll-last-modified-at needs full history
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.3', bundler-cache: true }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: bundle exec jekyll build
        env: { JEKYLL_ENV: production }
      - run: npx -y pagefind --site _site
      - run: bundle exec rake test    # html-proofer
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Pull requests build + lint but don't deploy. `main` deploys.

---

## Phase 13 — Pre-launch checklist

- [ ] All layouts render without console errors in Chrome + Firefox + Safari.
- [ ] `/feed.xml` validates.
- [ ] `/sitemap.xml` lists all pages and posts.
- [ ] `htmlproofer` passes on `_site`.
- [ ] Lighthouse score: Performance ≥ 95, Accessibility ≥ 95, SEO = 100, Best Practices ≥ 95.
- [ ] OG card preview verified (Twitter Card validator + Facebook Sharing Debugger).
- [ ] Search returns hits for terms in the seed post(s).
- [ ] Comments widget loads and accepts a test comment.
- [ ] Analytics fires only on production (verify in browser devtools on `localhost` — should be silent).
- [ ] HTTPS enforced; HTTP redirects 301 to HTTPS.
- [ ] `/404.html` looks intentional, not generic.
- [ ] DNS Search Console verified; sitemap submitted.

---

## Phase 14 — Post-launch (deferred until you're writing)

- Tag/category index pages styled and linked from the nav.
- Newsletter signup (Buttondown or ConvertKit) — only worth wiring once you have ~5 posts.
- Related-posts include using tag overlap (Jekyll's `site.related_posts` is weak; a tag-overlap algorithm in a small plugin works better).
- Reading list of recommended external posts (yegor's "Books" / "Talks" pattern).

---

## Suggested repo layout once Phase 3 is done

```
.
├── _config.yml
├── _data/
│   └── nav.yml                 # top-nav structure
├── _includes/
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   ├── post-meta.html
│   ├── comments.html
│   ├── search.html
│   ├── analytics.html
│   ├── social-icons.html
│   └── schema-article.html
├── _layouts/
│   ├── default.html
│   ├── home.html
│   ├── page.html
│   ├── post.html
│   ├── tag.html
│   └── category.html
├── _sass/
│   ├── _reset.scss
│   ├── _variables.scss
│   ├── _typography.scss
│   ├── _layout.scss
│   └── _post.scss
├── assets/
│   ├── css/main.scss
│   ├── css/syntax.css
│   ├── js/
│   └── img/
├── pages/
│   ├── about.md
│   ├── archive.md
│   └── tags.md
├── _posts/
│   └── 2026-04-21-hello-world.md
├── 404.html
├── CNAME                       # contains: zerodowntime.dev
├── robots.txt
├── Gemfile
├── Rakefile
└── .github/workflows/deploy.yml
```

---

## Time estimate

Assuming part-time evening work:

| Phase | Hours |
|---|---|
| 1–2 (toolchain, config) | 2–3 |
| 3 (layouts + design) | 6–10 |
| 4 (SEO) | 2 |
| 5 (search) | 2–3 |
| 6 (feed) | 0.5 |
| 7 (comments) | 1 |
| 8 (analytics) | 0.5 |
| 9 (highlighting + math) | 1–2 |
| 10 (quality gates) | 1–2 |
| 11 (custom domain) | 1 + DNS propagation |
| 12 (CI/CD) | 1–2 |
| 13 (launch checklist) | 1–2 |
| **Total** | **~20–30 hours** |

The design work in Phase 3 is the biggest variable. The rest is wiring.

---

## Review Comments

### 1. High: Phase 12 likely deploys the wrong artifact

The workflow in lines 325-329 builds once with `JEKYLL_ENV=production`, runs Pagefind against `_site`, and then runs `bundle exec rake test`. In Phase 1 / Phase 10, `rake test` is defined as depending on `:build`, which means the site is rebuilt again before `html-proofer` runs. Unless that Rake task is carefully written otherwise, this second build will happen in the default `development` environment and will also overwrite the Pagefind output. The artifact uploaded in line 329 would then be the rebuilt test artifact, not the earlier production artifact.

Recommendation: make `rake test` validate the existing `_site` instead of rebuilding it, or move to `bundle exec rake build` followed by `JEKYLL_ENV=production bundle exec rake test` only if `test` does not rewrite `_site`.

### 2. Medium: External link checking in CI will be noisy and brittle

Phase 10 sets `disable_external: false` for `html-proofer` (lines 257-259). For a blog that will link to outside articles, books, papers, GitHub repos, and vendor docs, this turns every deploy into a network-dependent check against third-party uptime, rate limits, and anti-bot behavior. The result is usually intermittent CI failures unrelated to your own changes.

Recommendation: keep internal link / anchor / image checks on every push, and run external link validation on a schedule or as a manual maintenance job.

### 3. Medium: The search plan is optional, but the CI plan assumes Pagefind unconditionally

Phase 5 presents search as a three-way choice, but Phase 12 always installs Node and runs `npx -y pagefind --site _site` (lines 323-327). That makes the overall plan internally inconsistent: if search is deferred or if Lunr is selected, the deployment workflow still carries a Pagefind-specific build step.

Recommendation: either commit to Pagefind earlier in the document and treat it as part of the baseline architecture, or make the Node/Pagefind steps explicitly conditional.

### 4. Medium: The reading-time helper will undercount short posts

The helper in line 134 uses `number_of_words | divided_by: 200`, which truncates in Liquid integer math. A 199-word post will display as `0` minutes. That is a visible UX bug on short posts, notes, and announcements.

Recommendation: round up and clamp to a minimum of 1 minute.

### 5. Medium: Core navigation pages that define the reference site's feel are deferred too late

The current `yegor256.com` home page relies heavily on the header menu and archive-style navigation, not just typography. In this plan, `archive.md` exists only in the suggested tree, and tag/category index pages are pushed to Phase 14. That weakens the "modeled on yegor256.com" goal because the information architecture is part of the design, not an optional add-on.

Recommendation: move at least `About`, `Archive/All posts`, and the basic top-nav structure into Phase 3 so the layout is designed around real destinations from the start.

### 6. Low: The quality-gate story drifts from the source-of-truth section without saying so

Section 0 calls out `w3c_validators` and `scss_lint` as observed quality gates on the reference site, while Phase 10 swaps in `stylelint` and omits any replacement for the validator step. That may be the right tradeoff, but it should be treated as an intentional divergence rather than implied parity.

Recommendation: note explicitly that the implementation keeps the spirit of the quality gates while modernizing the exact tool choices.
