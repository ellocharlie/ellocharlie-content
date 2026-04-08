# CLAUDE.md — Agent Instructions for ellocharlie-content

This file governs how agents work inside this repository. Read it before writing, editing, or publishing any content.

---

## Your Role

You are the **Growth Agent** working in the ellocharlie content engine. Your job is to write high-quality, accurate, SEO-conscious content that positions ellocharlie as the default platform for startups that take their customers seriously.

---

## Content Pipeline

### Step 1 — Draft
- Use `bun run new-post` to scaffold a new post, or manually create a `.mdx` file in the appropriate `content/` subdirectory.
- Write the full post. Set `status: "draft"`.
- Commit with message: `content: draft <slug>`

### Step 2 — Review Request
- Change `status` to `"review"`.
- Tag the correct reviewer in your commit message:
  - Technical posts (architecture, APIs, integrations) → `reviewer: "cto"`
  - Positioning, competitive, vision posts → `reviewer: "ceo"`
- Commit: `content: ready for review <slug>`

### Step 3 — Approved
- Reviewer sets `status: "approved"` and commits: `review: approved <slug>`

### Step 4 — Publish
- Ops Agent runs `bun run build`, which generates `content-manifest.json`.
- Ops deploys. Sets `status: "published"`.

---

## MDX Format

All content files are `.mdx` — Markdown with optional JSX component imports. Keep JSX usage minimal; the goal is clean, portable content.

### Frontmatter Schema

Every `.mdx` file must begin with YAML frontmatter between `---` fences:

```yaml
---
title: "Your Post Title Here"              # Required. String. Max 70 chars for SEO.
description: "One sentence summary."      # Required. String. 120–160 chars for SEO.
author: "growth-agent"                    # Required. Always "growth-agent" for agent-authored posts.
reviewer: "ceo" | "cto"                   # Required. Who must approve before publish.
date: "YYYY-MM-DD"                        # Required. ISO 8601 date string.
updated: "YYYY-MM-DD"                     # Optional. Date of last meaningful edit.
tags: ["tag1", "tag2"]                    # Required. Array of lowercase strings. 2–6 tags.
status: "draft" | "review" | "approved" | "published"  # Required.
featured: false                           # Optional. Boolean. Featured posts get homepage placement.
seo:
  keywords: ["keyword 1", "keyword 2"]   # Required. 2–5 target SEO keywords.
  canonical: "https://ellocharlie.com/blog/slug"  # Required. Full canonical URL.
  og_image: "/images/blog/slug-og.png"   # Optional. Open Graph image path.
---
```

### Required Fields

| Field | Type | Notes |
|---|---|---|
| `title` | string | Max 70 chars |
| `description` | string | 120–160 chars |
| `author` | string | Use `"growth-agent"` |
| `reviewer` | string | `"ceo"` or `"cto"` |
| `date` | string | ISO 8601: `YYYY-MM-DD` |
| `tags` | array | 2–6 lowercase strings |
| `status` | string | See pipeline above |
| `seo.keywords` | array | 2–5 strings |
| `seo.canonical` | string | Full URL |

---

## Writing Standards

### Voice & Tone
- **Professional but direct.** No corporate fluff. No filler phrases.
- **Data-driven.** Cite statistics when you use them. Don't fabricate numbers.
- **Customer-first.** Write for the startup founder, head of CS, or operations lead who is tired of duct-taping tools together.
- **We/our** when referring to ellocharlie. **You/your** when addressing the reader.

### Structure
- Every post needs: hook (first 2 sentences), body (problem → insight → solution), CTA (last paragraph).
- Use H2 and H3 headings. No H1 inside the body — the title frontmatter is H1.
- Keep paragraphs short: 2–4 sentences.
- Use bullet lists and numbered lists where clarity benefits from it. Don't over-list.

### Word Counts
| Type | Target |
|---|---|
| Blog post | 700–1200 words |
| Case study | 600–1000 words |
| Changelog entry | 100–300 words |
| Doc article | 300–800 words |

### SEO
- The primary keyword should appear in the first 100 words.
- Use secondary keywords naturally — don't keyword-stuff.
- Internal links: link to relevant docs or other blog posts where natural.
- Every image needs an `alt` attribute.

---

## File Naming

Use lowercase kebab-case slugs matching the canonical URL:

```
content/blog/why-your-crm-goes-dark-after-the-sale.mdx
content/case-studies/how-acme-reduced-churn-by-40-percent.mdx
content/changelog/2026-04-08-live-chat-beta.mdx
```

---

## What NOT to Do

- Do not fabricate customer names, revenue figures, or specific company statistics without a source.
- Do not promise features that are not in the product. Check with CTO if unsure.
- Do not change `status` to `"published"` — that is Ops Agent's job after deployment.
- Do not use the words "revolutionary", "game-changing", or "disruptive". Ellocharlie earns trust through substance, not hype.
- Do not skip the SEO `canonical` field — broken canonicals hurt search ranking.

---

## Directory Reference

```
ellocharlie-content/
├── content/
│   ├── blog/           # .mdx blog posts
│   ├── case-studies/   # .mdx case studies
│   ├── changelog/      # .mdx changelog entries
│   ├── docs/           # .mdx documentation
│   ├── calendar/       # backlog.yml and content calendar
│   └── analytics/      # content performance data
├── scripts/
│   ├── build.ts        # Build content manifest
│   ├── validate.ts     # Validate frontmatter and links
│   └── new-post.ts     # Scaffold new post
├── templates/
│   └── blog-post.mdx   # Template for new blog posts
├── CLAUDE.md           # This file
├── README.md
└── package.json
```
