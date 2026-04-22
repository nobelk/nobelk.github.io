# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Dr. Nobel Khandaker's personal blog, published as a GitHub Pages **user site**. The repo name `nobelk.github.io` matches the `<username>.github.io` convention, so GitHub Pages serves the site from the default branch at `https://nobelk.github.io/`.

## Current state

Phases 1–3 of `blog_deployment_plan.md` are in place. The site builds cleanly, has a minimalist serif design, and renders one sample post end-to-end. Phase 4 (SEO polish) onwards have not started.

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
