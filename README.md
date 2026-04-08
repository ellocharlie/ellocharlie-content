# ellocharlie-content

This is the content engine for [ellocharlie](https://ellocharlie.com) — the unified CRM, helpdesk, docs, and status platform built for growing startups.

## What Lives Here

All published and in-progress content for ellocharlie's marketing, education, and product presence:

| Directory | Purpose |
|---|---|
| `content/blog/` | Blog posts — growth, product, and thought leadership |
| `content/case-studies/` | Customer case studies and success stories |
| `content/changelog/` | Product changelog entries |
| `content/docs/` | Documentation articles and guides |
| `content/calendar/` | Content calendar and backlog |
| `content/analytics/` | Content performance tracking |

## Content Pipeline

```
Growth Agent → writes draft (MDX + frontmatter)
     ↓
Reviewer (CTO or CEO) → checks accuracy / positioning
     ↓
status: "approved"
     ↓
Ops Agent → deploys to ellocharlie.com
```

### Who Does What

- **Growth Agent** — Primary content author. Writes all blog posts, case studies, and changelog entries. Sets `author: "growth-agent"` in frontmatter.
- **CTO** — Reviews technical posts for accuracy, architecture claims, and code correctness. Sets `reviewer: "cto"`.
- **CEO** — Reviews positioning, messaging, and competitive claims. Sets `reviewer: "ceo"`.
- **Ops Agent** — Runs `bun run build` to validate and publish once status is `approved`.

## Scripts

```bash
bun run validate      # Validate all MDX frontmatter and links
bun run build         # Build content manifest (content-manifest.json)
bun run new-post      # Scaffold a new blog post
```

## Content Format

All content is written in **MDX** (Markdown + JSX). See `templates/blog-post.mdx` for the standard template and `CLAUDE.md` for the full frontmatter schema.

## Standards

- Blog posts: 700–1200 words
- Case studies: 600–1000 words
- Changelog entries: 100–300 words
- All posts require `title`, `description`, `author`, `reviewer`, `date`, `tags`, `status`, and `seo` frontmatter fields
- No post may move to `status: published` without a reviewer sign-off

## Deployment

Ops deploys content to ellocharlie.com via CI/CD. The `build` script generates `content-manifest.json` which the site consumes.
