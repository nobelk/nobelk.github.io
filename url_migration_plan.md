# URL Migration Plan: `zerodowntime.dev` → `outloop.blog`

## Goal

Move the live site from the custom domain `https://zerodowntime.dev` to
`https://outloop.blog` with correct SEO/canonical metadata and working HTTPS,
and with no broken **internal** links. Preserving **external/inbound** links to
the old domain is a separate, explicit requirement handled in B5 (keep the old
domain and redirect it) — it is not automatic.

## Current state (from repo audit, 2026-06-17)

| Location | Reference | Action |
|----------|-----------|--------|
| `CNAME` | `outloop.blog` | **Already done** (commit `3b43b55`) |
| `_config.yml:9` | `url: https://zerodowntime.dev` | **Must change** — authoritative source |
| `_config.yml:81` | `# e.g. "zerodowntime.dev"` (plausible comment) | Cosmetic — update example |
| `_build/og-card.svg:14` | text `zerodowntime.dev` | Regenerate SVG + `og-default.png` |
| `assets/img/og-default.png` | rendered old domain | Regenerate from SVG |
| `CLAUDE.md` | 6 documentation references | Update docs |
| `.claude/settings.local.json` | curl/WebFetch allowlist entries | Optional local cleanup |
| `_posts/`, `_includes/`, `_layouts/`, `robots.txt` | **no hardcoded host** | Nothing — `absolute_url` auto-resolves |

**Key finding:** the repo is in a split-brain state at the *artifact* level.
`CNAME` already says `outloop.blog` (so the **published artifact** is configured
for the new host) while every generated absolute URL (`url:` in `_config.yml`)
still says `zerodowntime.dev`. Closing that gap is the core of this migration.
Caveat: a repo audit cannot prove that live DNS resolves to GitHub Pages, that
the Pages custom-domain setting is updated, or that the cert is issued — those
are external states verified in Part B.

## Part A — In-repo changes (this PR)

1. **`_config.yml:9`** — `url: https://outloop.blog`. This is the one change
   that re-resolves the sitemap, `feed.xml`, canonical `<link>`, Open Graph
   `og:url`, and JSON-LD `BlogPosting`/`WebSite` URLs at build time.
2. **`_config.yml:81`** — update the Plausible example comment to
   `# e.g. "outloop.blog"`. (`plausible.domain` itself is blank/inactive, so no
   functional change.)
3. **`_build/og-card.svg`** — change the `zerodowntime.dev` text node to
   `outloop.blog`, then regenerate `assets/img/og-default.png` (1200×630) from
   it. Without this, social-share cards keep showing the old domain.
   - *Branding note:* the SVG and `_config.yml` `title:` still read
     "Zero Downtime". Renaming the brand is **out of scope** for a URL move —
     flag to the user as a separate decision.
4. **`CLAUDE.md`** — update the 6 prose references so the docs match reality
   (purpose paragraph, Phase 2, Phase 8 example, Phase 11 notes).
5. **`.claude/settings.local.json`** — update the `zerodowntime.dev` curl /
   WebFetch allowlist entries to `outloop.blog` (local convenience only; not
   shipped).

## Part B — Infrastructure (outside the repo — user/operator actions)

These cannot be done from the repo and must be coordinated by the domain owner:

1. **Verify the new domain in GitHub first (anti-takeover):** account/org →
   Settings → Pages → "Verify a domain" → add the `_github-pages-challenge-…`
   TXT record GitHub provides for `outloop.blog`. Do this **before** attaching
   the domain to the repo so a dangling domain can't be claimed by another
   account.
2. **DNS for `outloop.blog` (apex):** point the apex at GitHub Pages using
   **either** an `ALIAS`/`ANAME` record (if your DNS provider supports it,
   preferred — it survives IP changes) **or** the four GitHub Pages `A` records
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (with the matching `AAAA` records recommended). A bare `CNAME` at the apex is
   not valid DNS, which is why `ALIAS`/`ANAME` or `A`/`AAAA` is needed there.
   **Also configure `www.outloop.blog` as a `CNAME` → `nobelk.github.io`** —
   GitHub recommends setting both so it can canonicalize/redirect between the
   apex and `www` variants. Treat `www` as required, not optional, for a
   zero-link-breakage migration.
3. **GitHub Pages setting:** repo → Settings → Pages → set custom domain to
   `outloop.blog`, wait for the DNS check to pass, then wait for the Let's
   Encrypt cert to provision before ticking **Enforce HTTPS**.
4. **HSTS:** `.dev` is on the HSTS preload list (forced HTTPS); `.blog` is not
   preloaded by default, so the cutover is lower-risk than the original
   `.dev` setup — but still do not enable "Enforce HTTPS" until the cert is
   issued, or the site will be briefly unreachable.
5. **Old domain (`zerodowntime.dev`) — keep + redirect (required for inbound
   links):** to avoid breaking existing inbound links/bookmarks and to transfer
   SEO equity, keep `zerodowntime.dev` registered and serve a **301 redirect**
   to the matching path on `outloop.blog`. **This is NOT something this repo or
   its GitHub Pages site can do** — a Pages site serves exactly one custom
   domain (the one in `CNAME`) and only auto-redirects between that domain's own
   apex/`www` pair. Cross-domain redirect needs separate infrastructure, e.g.:
   - registrar/DNS-level forwarding with path preservation, or
   - a Cloudflare (or similar) redirect rule on `zerodowntime.dev`, or
   - a second GitHub Pages repo whose `CNAME` is `zerodowntime.dev`, doing
     path-preserving redirects (Pages can't host-redirect, so this means
     `<meta http-equiv="refresh">` / JS shims — weakest option, last resort).
   Letting the old domain lapse is possible but **breaks all inbound links** and
   forfeits SEO equity; only choose it if that's acceptable. Recommended: keep +
   301 for at least several months (ideally a year).
6. **Search Console / Bing:** add & verify `outloop.blog` as a new property,
   resubmit `https://outloop.blog/sitemap.xml`. **Only after** the B5 301s are
   live and both old and new properties are verified, use Google's Change of
   Address tool (`zerodowntime.dev` → `outloop.blog`). Then activate
   `webmaster_verifications:` in `_config.yml` if a verification token is
   issued.
7. **Plausible:** no action — `plausible.domain` is blank/inactive. If
   analytics are later activated, use `outloop.blog`.

## Part C — Things that DON'T need changing (verified)

- **giscus comments:** `mapping: pathname` ties threads to URL *paths*, not the
  host, so comment threads survive the domain change. (Also currently inactive
  — blank `repo_id`.)
- **`robots.txt`:** uses `{{ '/sitemap.xml' | absolute_url }}`, auto-resolves.
- **`jekyll-feed` / `jekyll-sitemap` / `jekyll-seo-tag`:** all derive from
  `site.url`; no per-file edits.
- **Internal post links / images:** all root-relative; unaffected.

## Verification

1. `bundle exec rake build`
2. Confirm the new host propagated into generated output:
   - `grep -r "outloop.blog" _site/sitemap.xml _site/feed.xml` → present
   - `grep -rc "zerodowntime.dev" _site/` → `0` (no stale absolute URLs)
   - spot-check one post's `<link rel="canonical">` and `og:url`
3. `bundle exec rake test` (html-proofer, internal links)
4. `npm run lint`
5. **Post-DNS smoke test** (after Part B): `curl -sI https://outloop.blog/`
   returns `200` and a valid TLS cert; `https://outloop.blog/sitemap.xml` loads;
   `curl -sI https://www.outloop.blog/` canonicalizes (301) to the apex.
6. **Old-domain redirect test** (after B5): `curl -sI https://zerodowntime.dev/<some-post-path>`
   returns a `301` whose `Location` is the **same path** on `https://outloop.blog/`.
   Do not run Google's Change of Address tool until this passes.

## Sequencing & risk

- Part A (repo) and the DNS/Pages steps in Part B should land close together.
  If `url:` flips to `outloop.blog` *before* DNS resolves, the live site (still
  served at the old host until DNS cuts over) will emit absolute URLs pointing
  at a not-yet-live domain. Safest order: domain verification + DNS + Pages cert
  ready (B1–B4), then merge Part A, then set up the old-domain redirect (B5) and
  Search Console (B6).
- OG/social caches (LinkedIn, Slack, etc.) cache the old card image and URL;
  they refresh on their own schedule or via each platform's debugger.

## Out of scope (flag to user)

- Rebranding the site title/tagline away from "Zero Downtime".
- The exact mechanism/provider for the old-domain 301 redirect (operator
  decision in B5) — the plan requires the redirect but not a specific vendor.
