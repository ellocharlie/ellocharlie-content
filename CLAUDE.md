# CLAUDE.md — ellocharlie-content

> Instructions for agents and humans working in the ellocharlie content engine.
> Read `MEMO.md` in `ellocharlie-engine` before writing anything — it encodes the company voice and values that all content must reflect.

---

## What This Repo Is

`ellocharlie-content` is the **content engine for the agent-driven company**. It is:

- The source of truth for all published content: blog posts, case studies, changelog entries, documentation
- An **agent-first pipeline** — the Growth agent drafts, CTO reviews technical accuracy, CEO approves positioning, Ops deploys
- A **structured MDX system** with schema validation, automated manifest builds, and a content calendar backlog
- Owned by the **Growth agent** (`agents/growth.yml` in the engine repo)

Content is not a side project. It is a primary acquisition channel. The target is **100 articles by month 12**, compounding search equity from day one (per `GROWTH.md`).

---

## Part of the Ellocharlie Org

This repo is a **submodule** inside `ellocharlie-engine` at `modules/content`.

- Superrepo: `https://github.com/ellocharlie/ellocharlie-engine`
- `workspace.yaml` in the engine is the single source of truth for KPIs and OKRs
- Current content KPI: **3 posts/week**, **100 articles by month 12**
- SEO authority compounds — every week without publishing is a week of lost search equity

When you need org context — mission, ICP, product scope, pricing — read `workspace.yaml` and `MEMO.md` in the engine repo.

---

## Content Pipeline

The pipeline has four stages. Every piece of content moves through them in order. Do not skip stages.

### Stage 1 — Draft (Growth agent)

```bash
bun run new-post
```

Scaffolds a new `.mdx` file in the correct `content/` subdirectory with pre-filled frontmatter from `templates/blog-post.mdx`. Alternatively, create the file manually — but use the template schema exactly.

- Set `status: "draft"`
- Write the full piece
- Commit: `content: draft <slug>`

### Stage 2 — Review Request (Growth agent → Reviewer)

- Change `status` to `"in-review"`
- Set `reviewer` in frontmatter to the appropriate agent:
  - Technical posts (architecture, APIs, integrations, code) → `reviewer: "cto"`
  - Positioning, competitive, vision, company posts → `reviewer: "ceo"`
- Commit: `content: ready for review <slug>`

### Stage 3 — Approved (CTO or CEO)

- Reviewer reads the post against their domain (technical accuracy or strategic positioning)
- Sets `status: "approved"`
- Commits: `review: approved <slug>`

CTO checks: factual accuracy, no feature promises beyond current scope, correct API/integration details.
CEO checks: voice alignment with MEMO.md, positioning consistency, no claims that conflict with GROWTH.md strategy.

### Stage 4 — Published (Ops agent)

- Ops runs `bun run build` → generates `content-manifest.json`
- Ops deploys to production
- Sets `status: "published"`

**Only Ops sets `status: "published"`.** Growth agent and reviewers must not set this status themselves.

---

## Frontmatter Schema

Every `.mdx` file must begin with YAML frontmatter between `---` fences. All required fields must be present — the `validate.ts` script enforces an 11-point check and will fail the build if any are missing.

```yaml
---
title: "Your Post Title Here"
description: "One-sentence summary of the post."
author: "growth-agent"
reviewer: "ceo" | "cto"
date: "YYYY-MM-DD"
updated: "YYYY-MM-DD"         # Optional — date of last meaningful edit
tags: ["tag1", "tag2"]
status: "draft" | "in-review" | "approved" | "published" | "archived"
featured: false               # Optional — featured posts get homepage placement
seo:
  keywords: ["keyword 1", "keyword 2"]
  canonical: "https://ellocharlie.com/blog/slug"
  og_image: "/images/blog/slug-og.png"   # Optional
---
```

### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Max 70 chars for SEO |
| `description` | string | Yes | 120–160 chars for SEO |
| `author` | string | Yes | Use `"growth-agent"` for agent-authored content |
| `reviewer` | string | Yes | Must be `"ceo"` or `"cto"` |
| `date` | string | Yes | ISO 8601: `YYYY-MM-DD` |
| `updated` | string | No | ISO 8601 when post is meaningfully revised |
| `tags` | array | Yes | 2–6 lowercase strings |
| `status` | string | Yes | See valid status values below |
| `seo.keywords` | array | Yes | 2–5 target keyword strings |
| `seo.canonical` | string | Yes | Full canonical URL — broken canonicals hurt ranking |

### Status Values

| Status | Set by | Meaning |
|--------|--------|---------|
| `draft` | Growth | Work in progress, not ready for review |
| `in-review` | Growth | Submitted to reviewer |
| `approved` | CTO / CEO | Cleared for deployment |
| `published` | Ops | Live on production |
| `archived` | Ops | Removed from active publication |

---

## Scripts

All scripts run with Bun from the repo root.

### `bun run build` → `scripts/build.ts`

Validates all `.mdx` files and generates `content-manifest.json`. Run before any deployment. Fails on validation errors.

### `bun run validate` → `scripts/validate.ts`

Runs the 11-point frontmatter and content check without building the manifest. Use during drafting to catch issues early. Checks include:
1. All required frontmatter fields present
2. `title` ≤ 70 characters
3. `description` 120–160 characters
4. `date` is valid ISO 8601
5. `tags` is a non-empty array with 2–6 items
6. `status` is one of the valid values
7. `seo.canonical` is a valid HTTPS URL
8. `seo.keywords` is a non-empty array
9. File slug matches the canonical URL slug
10. No missing `alt` attributes on images
11. No broken internal links

### `bun run new-post` → `scripts/new-post.ts`

Interactive scaffolder. Prompts for title and type, creates a pre-filled `.mdx` file in the correct directory, and adds an entry to `content/calendar/backlog.yml` with `status: "queued"`.

---

## Content Calendar

The content backlog lives in `content/calendar/backlog.yml`. This is the Growth agent's working queue.

The `workflows/content-pipeline.ts` script in the engine repo reads this backlog Mon/Wed/Fri and creates draft files for the next scheduled topic. After a draft is created, the backlog entry status changes from `"queued"` to `"drafting"`.

Do not delete backlog entries — change the status to `"archived"` if a topic is no longer relevant.

---

## Voice and Tone

All content must reflect the voice established in `MEMO.md`. The short version:

- **Professional, but direct.** No corporate fluff. No filler phrases. Say it plainly.
- **Data-driven.** Cite statistics when you use them. Never fabricate numbers, customer names, or company metrics.
- **Empathetic.** Write for the startup founder who is tired of duct-taping tools together. They've felt this pain. Acknowledge it.
- **We/our** for ellocharlie. **You/your** for the reader.
- **Not buzzwordy.** Never use "revolutionary," "game-changing," "disruptive," "synergistic," or "leverage" as a verb.

### Structure every post

1. **Hook** — first 1–2 sentences establish the problem or tension. Don't bury the lede.
2. **Body** — problem → insight → solution. Short paragraphs (2–4 sentences). Use H2/H3 headings. No H1 inside the body (title frontmatter is H1).
3. **CTA** — last paragraph links to a relevant product page or trial signup. Keep it natural, not salesy.

### Word count targets

| Content type | Target |
|-------------|--------|
| Blog post | 700–1,200 words |
| Case study | 600–1,000 words |
| Changelog entry | 100–300 words |
| Doc article | 300–800 words |

---

## SEO Standards

- The primary keyword must appear in the first 100 words.
- Use secondary keywords naturally — never keyword-stuff.
- Every image needs an `alt` attribute — validate.ts will flag missing alts.
- Internal links: link to relevant docs or other blog posts where natural. Every published post should have at least one internal link.
- `seo.canonical` is required and must be set before review — broken canonicals directly hurt ranking.

### Priority keyword categories (from GROWTH.md)

- "CRM for startups" and long-tail variants
- "customer onboarding software" + startup/SaaS variants
- "helpdesk for small teams" comparisons
- "CRM + helpdesk combined" (a category gap in most comparison content)
- "how to onboard SaaS customers" (top-of-funnel)
- Competitor comparisons (HubSpot, Intercom, Zendesk for small teams)

---

## File Naming

Use lowercase kebab-case slugs. The file slug must match the `seo.canonical` URL slug — validate.ts enforces this.

```
content/blog/why-your-crm-goes-dark-after-the-sale.mdx
content/case-studies/how-acme-reduced-churn-by-40-percent.mdx
content/changelog/2026-04-08-live-chat-beta.mdx
content/docs/getting-started-with-workflows.mdx
```

---

## Directory Reference

```
ellocharlie-content/
├── content/
│   ├── blog/           # .mdx blog posts (primary SEO surface)
│   ├── case-studies/   # .mdx case studies (conversion surface)
│   ├── changelog/      # .mdx changelog entries (trust/transparency)
│   ├── docs/           # .mdx documentation articles (retention/onboarding)
│   ├── calendar/
│   │   └── backlog.yml # Content calendar queue — Growth agent's working list
│   └── analytics/      # Content performance data (views, rank, conversions)
├── scripts/
│   ├── build.ts        # Validates + generates content-manifest.json
│   ├── validate.ts     # 11-point frontmatter and content check
│   └── new-post.ts     # Interactive post scaffolder
├── templates/
│   └── blog-post.mdx   # Canonical template for new blog posts
├── CLAUDE.md           # This file
├── README.md
└── package.json
```

---

## What Not to Do

- Do not fabricate customer names, revenue figures, or company statistics without a source. Cite everything.
- Do not promise features that are not in the product. Check with CTO if unsure whether something is shipped.
- Do not set `status: "published"` — that is Ops agent's responsibility after deployment.
- Do not skip the `seo.canonical` field — broken canonicals directly hurt search ranking.
- Do not use the words "revolutionary," "game-changing," or "disruptive."
- Do not create files outside the `content/` subdirectory unless adding a new script or template.
- Do not edit `content-manifest.json` by hand — it is generated by `bun run build`.
- Do not archive backlog entries — only mark them `"archived"` and leave them in the file.
