# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Dr. Nobel Khandaker's personal blog. The repo follows the GitHub Pages user-site convention (`<username>.github.io`), but the site is served at the **custom domain `https://zerodowntime.dev`** via the `CNAME` file at the repo root. Don't change `CNAME` or `_config.yml`'s `url:` without coordinating with whatever DNS / GitHub-Pages settings are upstream.

## Current state

Phases 1–10 and 12 of `blog_deployment_plan.md` are in place. Phase 11 (custom domain) was done out-of-order in the earlier sessions. Phase 13 is a pre-launch verification checklist — the current run of `rake build && rake test` passes cleanly. Phase 14 (post-launch polish) is still open by design.

Three features ship *code-complete but activation-gated*: giscus comments, Plausible analytics, and KaTeX/Mermaid on-page toggles. They render nothing until the operator fills in the `_config.yml` block or adds the per-post front-matter flag. Details in the per-phase notes below.

**Phase 1 — toolchain (done)**
- `.ruby-version` → `3.3.5`
- `Gemfile` → Jekyll 4.3 (direct, **not** the `github-pages` gem) + Kramdown GFM + Rouge + `jekyll-feed`, `jekyll-sitemap`, `jekyll-seo-tag`, `jekyll-paginate`, `jekyll-redirect-from`, `jekyll-archives`, `jekyll-last-modified-at`. `html-proofer` and `rubocop` are in the `development, test` group.
- `Rakefile` → `rake build`, `rake serve`, `rake test`. `rake test` validates the existing `_site/` with `html-proofer` and does **not** rebuild, so a CI pipeline can do `build → pagefind → test` without clobbering the production artifact.

**Phase 2 — config + skeleton (done)**
- `_config.yml` populated per the plan, with one deviation: `url: https://nobelk.github.io` is used (with a comment) until Phase 11 cuts the custom domain over to `https://zerodowntime.dev`. Setting the planned domain now would emit absolute URLs in feed/sitemap/canonical pointing to a host that doesn't resolve.
- Empty `_drafts/` and `assets/img/` carry `.gitkeep` placeholders so git tracks them.
- `404.html` uses `layout: null` and `sitemap: false`.

**Phase 3 — layouts + design system (done)**
- `_data/nav.yml` drives the top nav (Home / Archive / About).
- Layouts: `default`, `home` (paginated), `post`, `page`, `tag`, `category`. Pagination, jekyll-archives tag/category index pages, and SEO/feed metadata are all live.
- Includes: `head`, `header`, `footer`, `post-meta`, `reading-time`, `social-icons`, `pagination` are real. `comments` and `analytics` are **intentionally empty stubs** that Phases 7 and 8 will fill in. The `post` layout already calls `comments.html`, so wiring giscus later is just an include-body change — no layout edits required.
- SCSS uses dart-sass `@use` (not deprecated `@import`); each partial declares its own `@use "variables" as *`. `assets/css/main.scss` is the entry point. Web fonts (PT Serif, JetBrains Mono) load from Google Fonts with the standard two-preconnect pattern.
- `pages/about.md` and `pages/archive.md` were pulled forward from the plan's Phase 14 per a review-comment recommendation, so the nav has real destinations from day one.
- `_includes/reading-time.html` rounds **up** with `divided_by: 200.0 | ceil` and clamps to 1 minute, fixing the "0 min" undercount the plan's Liquid-integer formula would have produced for short posts.
- Build is clean (zero warnings) and all 11 routes (home, post, about, archive, tag, category, 404, css, js, feed, sitemap) return 200 from `bundle exec rake serve`.

**Phase 4 — SEO (done)**
- `{% seo %}` in `_includes/head.html` emits canonical link, full Open Graph block, Twitter Card meta, and JSON-LD (`BlogPosting` for posts, `WebSite` for the homepage). The plan's idea of writing a custom `_includes/schema-article.html` was not needed — `jekyll-seo-tag` already covers `headline`, `datePublished`, `dateModified`, `author`, `mainEntityOfPage`, and (when `page.image` is set) `image`.
- **Author config is split between two keys** — see the long comment at the top of `_config.yml`. `site.author` is a string (just the name) so jekyll-seo-tag can't fall through to its broken Twitter handle inference. `site.owner` is a hash with structured data (email, github, …) consumed only by our own templates (`footer.html`, `social-icons.html`).
- `site.twitter` and `site.social` are **intentionally absent** — both have known footguns when configured without complete data. Comments in `_config.yml` describe what to add and when.
- `robots.txt` is an explicit Liquid-templated file at the repo root (overrides the one `jekyll-sitemap` would auto-generate); the sitemap URL re-resolves automatically when `site.url` flips to `https://zerodowntime.dev` in Phase 11.
- `webmaster_verifications:` is stubbed (commented) in `_config.yml`. Activate it after registering the domain in Google Search Console / Bing Webmaster Tools.

**Phase 5 — Search (done, Pagefind)**
- Added `package.json` with `pagefind` as a devDependency. `bundle install` is no longer enough for a fresh clone — also run `npm install` once. The pagefind binary downloads via npm postinstall and is then invoked by the Rakefile.
- `Rakefile`'s `rake build` task now runs **jekyll build → `npx -y pagefind --site _site`** in sequence. CI just calls `rake build`. Local `rake serve` does **not** run pagefind, so search is non-functional during live-reload dev — that's an explicit trade-off, since pagefind would race against jekyll's `--watch` rebuilds. To test search locally: `rake build && (cd _site && python3 -m http.server)`.
- Search UI lives at `/search/` (linked from the top nav). The Default UI is loaded only on that page, so other pages don't pay the ~50 KB JS cost. The search include has a guarded fallback: if `pagefind-ui.js` is missing, it shows a "run rake build" hint instead of a blank widget.
- **Indexing scope** uses Pagefind's implicit-ignore rule: any page on the site that has a `data-pagefind-body` attribute "claims" the index, and pages without it are auto-excluded. `post.html` always carries the attribute on its `<article>`. `page.html` adds it conditionally (`{% unless page.pagefind == false %}`), so per-page front-matter `pagefind: false` opts a page out. `archive.md` and `search.md` use that opt-out — archive is a post-title list that would dilute results, and the search page indexing itself is meta-noise.
- `robots.txt` carries `Disallow: /pagefind/` so crawlers don't waste budget on the index files.
- Pagefind 1.5.2's CLI prints a recommendation to migrate to the new "Component UI" — that's a future polish item, not required. The Default UI remains supported.

**Phase 6 — RSS (done)**
- `/feed.xml` comes from `jekyll-feed`; discovery link is emitted once by `{% feed_meta %}` in `_includes/head.html`. The previous hand-rolled `<link rel="alternate">` was removed to avoid a duplicate self-referential tag that some aggregators flag.
- Visible RSS entry points: the footer, the `social-icons` include, and `about.md`.
- JSON Feed (`/feed.json`) is **not** implemented — the plan marked it optional and most RSS clients still want Atom.

**Phase 7 — Comments (code-complete, activation-gated)**
- Strategy: giscus (GitHub Discussions) over Disqus, per the plan's trade-off table.
- Gate lives in `_includes/comments.html`: widget only renders when `page.comments` **and** `site.giscus.repo_id.size > 0`. The `.size > 0` form is deliberate — a bare `!= ""` check lets nil values through because Liquid evaluates `nil != ""` as `true`.
- `_config.yml` carries a `giscus:` block with blank `repo`, `repo_id`, `category`, `category_id`. **To activate**: enable Discussions on the GitHub repo, install the `giscus` GitHub App, fill the form at <https://giscus.app>, paste the emitted IDs into `_config.yml`. No template edits needed after that.
- `data-mapping: pathname` is intentional — renaming a post breaks the thread less often than title-mapping, and pathname won't shift when `site.url` changes.

**Phase 8 — Analytics (code-complete, activation-gated)**
- Strategy: Plausible.
- Gate lives in `_includes/analytics.html`: tag only renders when `jekyll.environment == "production"` **and** `site.plausible.domain.size > 0`. Same `.size > 0` reasoning as comments.
- `_config.yml` carries a `plausible:` block with `domain: ""` and an optional `script_src` override (for domain-proxied deployments that dodge tracker-blockers). **To activate**: create a Plausible site, set `domain: "zerodowntime.dev"`. Local `rake serve` stays silent because `JEKYLL_ENV` defaults to `development`; the Actions workflow sets `JEKYLL_ENV=production`.

**Phase 9 — Highlighting + math + diagrams (done)**
- Rouge theme generated via `bundle exec rougify style github > _sass/_syntax.scss` and pulled in by `main.scss` via `@use "syntax"`. `.stylelintrc.json` ignores `_sass/_syntax.scss` because it's tool-generated.
- KaTeX and Mermaid are **opt-in per post**: add `math: true` or `mermaid: true` to front matter. `_includes/head.html` conditionally pulls in `math.html` / `mermaid.html`, which load the libraries from jsDelivr. Both are unpinned beyond a hard-coded CDN version string in the include (bump there to upgrade).
- Mermaid's include rewrites kramdown's `<pre><code class="language-mermaid">` into the `<pre class="mermaid">` shape Mermaid expects before calling `mermaid.run()`. `securityLevel: "strict"` is set so pasted-example diagrams can't execute scripts or click-handlers.

**Phase 10 — Quality gates (done, with divergence from the plan's tool list)**
- Kept: `html-proofer` (internal links on every build, externals on a weekly schedule — see the external-links workflow), `rubocop`.
- Added: `stylelint` + `stylelint-config-standard-scss` and `markdownlint-cli2`, with `.stylelintrc.json` and `.markdownlint-cli2.jsonc` tuned for prose-heavy content. Run via `npm run lint`.
- Dropped: `w3c_validators` (not replaced — modern browsers already surface most violations, and the added Ruby dep isn't worth the marginal signal) and `scss_lint` (stylelint is its modern successor). This is an intentional divergence from section 0 of `blog_deployment_plan.md`.

**Phase 11 — Custom domain (done)**
- `CNAME` at the repo root contains `zerodowntime.dev`.
- `_config.yml` uses `url: https://zerodowntime.dev`. Do not change without coordinating DNS / Pages custom-domain settings — `.dev` TLDs are on HSTS preload, so a mis-timed DNS cutover makes the site unreachable, not just downgraded.
- `webmaster_verifications:` in `_config.yml` is still commented out — activate after registering with Google Search Console and Bing Webmaster Tools.

**Phase 12 — CI/CD (done)**
- `.github/workflows/deploy.yml` runs on push to `main` and on PRs to `main`: checks out with `fetch-depth: 0` (so `jekyll-last-modified-at` can read full git history), sets up Ruby 3.3.5 + Node 20, runs `npm ci`, then `JEKYLL_ENV=production bundle exec rake build`, then `bundle exec rake test`, then uploads the `_site` artifact. `deploy` only runs on push events to `main`.
- `.github/workflows/external-links.yml` runs weekly (Mondays 12:00 UTC) and on manual dispatch. It's `continue-on-error: true` so upstream outages don't page anyone. This is the Phase-10 "external link validation" deferred off the hot path.
- **Don't run `rake test` before upload** — the Rakefile's `test` task validates the existing `_site`, never rebuilds it, which the plan's original workflow got wrong (Review Comment #1 in `blog_deployment_plan.md`). Running `build → test → upload` keeps a single authoritative artifact.

## Writing a post

Posts live in `_posts/` and follow Jekyll's `YYYY-MM-DD-slug.md` naming. `layout: post` and `comments: true` are applied automatically via the `_config.yml` defaults block, so they don't need to appear in the front matter. Standard schema:

```yaml
---
title: "Title in title case"
date: 2026-04-21 09:00:00 -0400               # required, with timezone offset
description: "150–160 char meta description."  # used by SEO + OG; don't just repeat the title
image: /assets/img/posts/2026-04-21-slug.png   # optional; enables OG/Twitter hero card
tags: [reliability, postgres]                  # optional; routes to /tag/<name>/ via jekyll-archives
categories: [systems]                          # optional; routes to /category/<name>/
pagefind: false                                # optional; opt this post out of search indexing
math: true                                     # optional; load KaTeX (auto-render $…$ and $$…$$)
mermaid: true                                  # optional; render ```mermaid fences as diagrams
comments: false                                # optional; hide giscus on this post (defaults to true)
---
```

Use `<!--more-->` to mark the excerpt cut. The home page shows everything before the marker. The reading-time helper rounds up and clamps to 1 minute, so even a one-paragraph note shows "1 min" rather than "0 min".

`pagefind: false` is rarely needed for posts (you usually want them searchable) — it's there for unusual cases like a post that's pure embed/redirect.

## Toolchain

Jekyll 4.3 built directly — we are deliberately **not** using the `github-pages` gem, because we rely on plugins (`jekyll-archives`, `jekyll-last-modified-at`, etc.) that aren't on the Pages whitelist. The consequence: GitHub Pages cannot build this repo natively. Phase 12 will add a GitHub Actions workflow that builds the site in CI and uploads `_site` as a Pages artifact. Do not re-add `github-pages` to the `Gemfile` — it will silently mask the divergence.

## Local development

Requires Ruby 3.3.5 (see `.ruby-version`). The macOS system Ruby (2.6.x) is too old; install via `mise` or `rbenv` first.

```
bundle install                 # once, after cloning or Gemfile changes
npm install                    # once, after cloning or package.json changes (Pagefind + linters)
bundle exec rake serve         # live-reload dev server at http://localhost:4000 (includes _drafts/)
bundle exec rake build         # one-shot build into _site/
bundle exec rake test          # html-proofer against _site/ (internal links only; externals deferred to a scheduled job)
npm run lint                   # stylelint (SCSS) + markdownlint-cli2 (posts and pages)
```

`rake serve` shows drafts; `rake build` (and therefore CI) does not.

Keep the existing `.gitignore` entries — they cover both Jekyll build output and Bundler's vendored gems.

## Conventions

- The site auto-deploys from the default branch via GitHub Pages — pushes to `main` go live. Treat `main` as a publishing branch, not just a development branch.
