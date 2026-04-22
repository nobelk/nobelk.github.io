# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Dr. Nobel Khandaker's personal blog. The repo follows the GitHub Pages user-site convention (`<username>.github.io`), but the site is served at the **custom domain `https://zerodowntime.dev`** via the `CNAME` file at the repo root. Don't change `CNAME` or `_config.yml`'s `url:` without coordinating with whatever DNS / GitHub-Pages settings are upstream.

## Current state

Phases 1–5 of `blog_deployment_plan.md` are in place. The site builds cleanly, has a minimalist serif design, renders one sample post end-to-end, ships full SEO metadata (canonical, Open Graph, Twitter Cards, JSON-LD `BlogPosting`), and has a working static search index via Pagefind. The custom domain `zerodowntime.dev` is live; `_config.yml`'s `url:` and the `CNAME` file at the repo root reflect that. Phase 6 (RSS polish) onwards have not started.

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
bundle exec rake serve         # live-reload dev server at http://localhost:4000 (includes _drafts/)
bundle exec rake build         # one-shot build into _site/
bundle exec rake test          # html-proofer against _site/ (internal links only; externals deferred to a scheduled job)
```

`rake serve` shows drafts; `rake build` (and therefore CI) does not.

Keep the existing `.gitignore` entries — they cover both Jekyll build output and Bundler's vendored gems.

## Conventions

- The site auto-deploys from the default branch via GitHub Pages — pushes to `main` go live. Treat `main` as a publishing branch, not just a development branch.
