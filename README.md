<div align="center">

# ellocharlie-content

**Content engine for ellocharlie — agent-generated blog, SEO, and social pipeline.**

[![CI](https://github.com/ellocharlie/ellocharlie-content/actions/workflows/ci.yml/badge.svg)](https://github.com/ellocharlie/ellocharlie-content/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.1+-black.svg)](https://bun.sh)
[![Part of ellocharlie-engine](https://img.shields.io/badge/superrepo-ellocharlie--engine-black.svg)](https://github.com/ellocharlie/ellocharlie-engine)

</div>

---

## What is this?

This is the content engine for [ellocharlie](https://www.ellocharlie.com). All published and in-progress content for the company's marketing, education, and product presence lives here.

Content is written primarily by the **Growth agent** (3 posts/week), reviewed by the **CTO** (technical accuracy) or **CEO** (positioning), and deployed to `ellocharlie.com` by the **Ops agent** via CI/CD. The full pipeline is automated — no human commit required for routine posts.

---

## Content Structure

| Directory | Purpose |
|-----------|---------|
| `content/blog/` | Blog posts — growth, product, and thought leadership |
| `content/case-studies/` | Customer case studies and success stories |
| `content/changelog/` | Product changelog entries |
| `content/docs/` | Documentation articles and guides |
| `content/calendar/` | Content calendar (`backlog.yml`) and scheduling |
| `content/analytics/` | Content performance tracking (`analytics.json`) |
| `templates/` | MDX templates for new content types |

---

## Content Pipeline

```
Growth Agent (draft)
       │
       │  writes MDX + frontmatter, sets status: "draft"
       ▼
CTO or CEO (review)
       │
       │  checks technical accuracy or positioning
       │  sets status: "approved"
       ▼
Ops Agent (publish)
       │
       │  runs `bun run build` → content-manifest.json
       │  triggers ellocharlie.com rebuild
       ▼
   LIVE on ellocharlie.com
```

### Who Does What

| Agent | Role in Pipeline |
|-------|-----------------|
| **Growth** | Primary author — blog posts, case studies, changelog, social. Sets `author: "growth-agent"`. |
| **CTO** | Reviews technical posts for accuracy, architecture claims, and code correctness. Sets `reviewer: "cto"`. |
| **CEO** | Reviews positioning, messaging, and competitive claims. Sets `reviewer: "ceo"`. |
| **Ops** | Runs `bun run build` once status is `approved`. Deploys via CI/CD. |

---

## How to Add a Post

### 1. Scaffold a new post

```bash
bun run new-post
# → prompts for title and slug
# → creates content/blog/YYYY-MM-DD-slug.mdx from template
```

### 2. Fill in frontmatter

Every post requires these frontmatter fields:

```yaml
---
title: "Why Onboarding Is Where Churn Starts"
description: "Most churn doesn't happen at renewal. It happens in week one."
author: "growth-agent"
reviewer: ""           # cto | ceo — set before requesting review
date: "2026-04-08"
status: "draft"        # draft → approved → published
tags: ["onboarding", "churn", "cx"]
seo:
  title: "Why Onboarding Is Where Churn Starts | ellocharlie"
  description: "Most churn doesn't happen at renewal. It happens in week one."
  keywords: ["onboarding", "churn reduction", "customer success"]
---
```

### 3. Write the content

- Blog posts: 700–1200 words
- Case studies: 600–1000 words
- Changelog entries: 100–300 words

### 4. Request review

Update `status: "review"` and set the `reviewer` field. The appropriate agent will pick it up automatically via the content pipeline trigger.

### 5. Publish

Once the reviewer sets `status: "approved"`, the Ops agent runs the build and publishes.

---

## Scripts Reference

```bash
bun run validate    # Validate all MDX frontmatter and internal links
bun run build       # Build content-manifest.json (consumed by ellocharlie.com)
bun run new-post    # Scaffold a new blog post from template
```

### `validate`

Checks that:
- All required frontmatter fields are present and correctly typed
- No `status: "published"` post is missing a `reviewer` sign-off
- Internal links resolve to real files

### `build`

Generates `content-manifest.json` — a structured index of all published content consumed by the ellocharlie.com site. Run automatically by the Ops agent as part of the deploy pipeline.

### `new-post`

Interactive scaffold. Prompts for title and slug, generates a pre-filled MDX file from `templates/blog-post.mdx`, and opens it in `$EDITOR` if set.

---

## Content Calendar

The content backlog lives in `content/calendar/backlog.yml`. Each entry defines:

```yaml
- title: "How AI-Powered Live Chat Reduces Ticket Volume by 60%"
  slug: "ai-live-chat-reduces-ticket-volume"
  target_date: "2026-04-15"
  assigned_agent: "growth-agent"
  review_chain:
    - reviewer: "cto"
      reason: "Technical claims about AI chat deflection rates"
  tags: ["live-chat", "ai", "support"]
  status: "planned"       # planned | in-progress | approved | published
  notes: "Lead with deflection stat. CTO to verify benchmark numbers."
```

The Growth agent reads `backlog.yml` at 10am UTC on Mon/Wed/Fri and picks the next `planned` item with the earliest `target_date`.

---

## Content Standards

| Standard | Rule |
|----------|------|
| Voice | Professional, direct, customer-first. No buzzwords. Lead with the problem. |
| Word count | Blog: 700–1200 · Case study: 600–1000 · Changelog: 100–300 |
| Frontmatter | All required fields must be present. Validated by `bun run validate`. |
| Review | No post may move to `status: published` without a reviewer sign-off. |
| Format | All content is MDX (Markdown + JSX). Use `templates/blog-post.mdx` as the base. |
| SEO | Every post requires an `seo` frontmatter block with `title`, `description`, and `keywords`. |

---

## Repository Layout

```
ellocharlie-content/
├── README.md                          # This file
├── package.json                       # Bun scripts
├── AGENTS.md                          # Agent operating instructions
├── CLAUDE.md                          # Claude Code agent instructions
├── CONTRIBUTING.md                    # Contribution guide
├── CHANGELOG.md                       # Release history
├── LICENSE                            # MIT
│
├── content/
│   ├── blog/                          # Published and draft blog posts (MDX)
│   ├── case-studies/                  # Customer case studies (MDX)
│   ├── changelog/                     # Product changelog (MDX)
│   ├── docs/                          # Documentation articles (MDX)
│   ├── calendar/
│   │   └── backlog.yml                # Content calendar and topic backlog
│   └── analytics/
│       └── analytics.json             # Content performance data
│
├── scripts/
│   ├── build.ts                       # Build content-manifest.json
│   ├── validate.ts                    # Validate frontmatter and links
│   └── new-post.ts                    # Interactive post scaffolding
│
└── templates/
    └── blog-post.mdx                  # Standard blog post template
```

---

## Part of the ellocharlie Org

This repo is a submodule inside [`ellocharlie-engine`](https://github.com/ellocharlie/ellocharlie-engine) at `modules/content`. Content here is deployed to [`ellocharlie.com`](https://github.com/ellocharlie/ellocharlie.com) via the Ops agent.

| Repo | Description |
|------|-------------|
| [ellocharlie/ellocharlie-engine](https://github.com/ellocharlie/ellocharlie-engine) | Superrepo — brain, dashboard, orchestrator |
| [ellocharlie/ellocharlie.com](https://github.com/ellocharlie/ellocharlie.com) | Marketing site — where this content is published |
| [ellocharlie/ellocharlie-agents](https://github.com/ellocharlie/ellocharlie-agents) | Agent runtimes and skills platform |

---

<div align="center">

Content pipeline powered by [Anthropic Claude](https://anthropic.com) · MIT License

</div>
