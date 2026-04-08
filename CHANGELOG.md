# Changelog — ellocharlie-content

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] - 2026-04-08

### Added

- **`templates/blog-post.mdx`** — Canonical template for all new blog posts. Includes the complete required frontmatter schema: `title`, `description`, `author`, `reviewer`, `date`, `updated`, `tags`, `status`, `featured`, and `seo` block (`keywords`, `canonical`, `og_image`). Pre-filled with placeholder values and inline comments explaining constraints.
- **`scripts/build.ts`** — Validates all `.mdx` files and generates `content-manifest.json`. Run before any deployment. Fails immediately on any validation error.
- **`scripts/validate.ts`** — 11-point frontmatter and content check. Validates: all required fields present, `title` ≤ 70 characters, `description` 120–160 characters, valid ISO 8601 dates, `tags` is 2–6 items, valid `status` value, `seo.canonical` is a valid HTTPS URL, `seo.keywords` is non-empty, file slug matches canonical URL slug, no missing `alt` attributes, no broken internal links.
- **`scripts/new-post.ts`** — Interactive post scaffolder. Prompts for title and content type, creates a pre-filled `.mdx` file in the correct subdirectory, and adds a `status: "queued"` entry to `content/calendar/backlog.yml`.
- **`package.json`** — Bun project config with scripts: `build`, `validate`, `new-post`.
- **`CLAUDE.md`** — Comprehensive agent and human instructions: content pipeline stages (Draft → Review Request → Approved → Published), frontmatter schema, field rules, status values, script reference, content calendar workflow, voice and tone guidelines, SEO standards, priority keyword categories, and file naming conventions.

### Content Pipeline

Four-stage pipeline established:

| Stage | Agent | Commit Convention |
|-------|-------|-------------------|
| Draft | Growth | `content: draft <slug>` |
| Review Request | Growth | `content: ready for review <slug>` |
| Approved | CTO / CEO | `review: approved <slug>` |
| Published | Ops | Handled by deploy workflow |

Only the Ops agent sets `status: "published"`. Growth and reviewers must not set this status.

### Directory Structure

```
content/
├── blog/           # .mdx blog posts (primary SEO surface)
├── case-studies/   # .mdx case studies (conversion surface)
├── changelog/      # .mdx changelog entries
├── docs/           # .mdx documentation articles
└── calendar/
    └── backlog.yml # Growth agent's content queue
```

### Content KPIs (from workspace.yaml)

- **3 posts/week** — Mon/Wed/Fri cadence
- **100 articles by month 12** — SEO compounding target

The Growth agent's content pipeline (via `ellocharlie-engine`) reads `backlog.yml` on schedule and scaffolds drafts automatically.

---

[Unreleased]: https://github.com/ellocharlie/ellocharlie-content/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ellocharlie/ellocharlie-content/releases/tag/v0.1.0
