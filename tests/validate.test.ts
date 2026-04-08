/**
 * Content validation tests for ellocharlie-content.
 *
 * Validates every .mdx file in content/blog/ against the required schema:
 *   - Required frontmatter fields: title, description, author, date, tags, status
 *   - date is ISO 8601 format (YYYY-MM-DD or full ISO string)
 *   - status is one of: draft | in-review | approved | published | archived
 *   - tags is an array (non-empty)
 *   - word count is between 200 and 5000
 *
 * Run with: bun test tests/validate.test.ts
 */

import { test, expect, describe, beforeAll } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Frontmatter {
  title?: unknown;
  description?: unknown;
  author?: unknown;
  date?: unknown;
  tags?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

interface ParsedPost {
  filePath: string;
  filename: string;
  frontmatter: Frontmatter;
  body: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set([
  "draft",
  "in-review",
  "approved",
  "published",
  "archived",
]);

const MIN_WORD_COUNT = 200;
const MAX_WORD_COUNT = 5000;

// ISO 8601 date: YYYY-MM-DD (the format used in this repo's frontmatter)
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal YAML front-matter parser. Handles:
 *   - Quoted strings: "value"
 *   - Unquoted strings
 *   - Inline arrays: [a, b, c]
 *   - Nested objects (ignored — we only need top-level keys)
 *
 * We intentionally avoid pulling in a YAML library so the test file has
 * zero external dependencies beyond Bun itself.
 */
function parseFrontmatter(raw: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = raw.split("\n");

  for (const line of lines) {
    // Skip blank lines and nested keys (indented)
    if (!line.trim() || line.startsWith(" ") || line.startsWith("\t")) {
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();

    if (!rawValue) {
      // Value is on the next line (block scalar / nested object) — skip
      continue;
    }

    // Inline array: [item1, item2]
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const inner = rawValue.slice(1, -1);
      result[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      continue;
    }

    // Quoted string
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      result[key] = rawValue.slice(1, -1);
      continue;
    }

    // Unquoted scalar
    result[key] = rawValue;
  }

  return result;
}

/**
 * Split a .mdx file into frontmatter YAML and body text.
 * Returns null if the file has no valid front-matter delimiters.
 */
function splitFrontmatter(content: string): { yaml: string; body: string } | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return null;

  const firstClose = trimmed.indexOf("\n---", 3);
  if (firstClose === -1) return null;

  const yaml = trimmed.slice(3, firstClose).trim();
  const body = trimmed.slice(firstClose + 4).trim();
  return { yaml, body };
}

/** Count words in a string (split on whitespace, ignore empty segments). */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Load all blog posts before tests run
// ---------------------------------------------------------------------------

const BLOG_DIR = resolve(import.meta.dir, "../content/blog");
let posts: ParsedPost[] = [];

beforeAll(async () => {
  const files = await readdir(BLOG_DIR);
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

  for (const filename of mdxFiles) {
    const filePath = join(BLOG_DIR, filename);
    const raw = await readFile(filePath, "utf-8");
    const split = splitFrontmatter(raw);

    if (!split) {
      // Still include the file so tests can report it as malformed
      posts.push({ filePath, filename, frontmatter: {}, body: raw });
      continue;
    }

    const frontmatter = parseFrontmatter(split.yaml);
    posts.push({ filePath, filename, frontmatter, body: split.body });
  }
});

// ---------------------------------------------------------------------------
// Meta checks
// ---------------------------------------------------------------------------

describe("Blog content directory", () => {
  test("contains at least one .mdx file", async () => {
    const files = await readdir(BLOG_DIR);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
    expect(mdxFiles.length).toBeGreaterThan(0);
  });

  test("all files have parseable front-matter delimiters", async () => {
    const files = await readdir(BLOG_DIR);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

    for (const filename of mdxFiles) {
      const raw = await readFile(join(BLOG_DIR, filename), "utf-8");
      const split = splitFrontmatter(raw);
      expect(split).not.toBeNull(
        // @ts-ignore - custom message
        `${filename} is missing opening/closing --- frontmatter delimiters`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Required fields
// ---------------------------------------------------------------------------

describe("Required frontmatter fields", () => {
  test("every post has a non-empty 'title'", () => {
    for (const post of posts) {
      expect(typeof post.frontmatter.title).toBe("string");
      expect((post.frontmatter.title as string).trim().length).toBeGreaterThan(0);
    }
  });

  test("every post has a non-empty 'description'", () => {
    for (const post of posts) {
      expect(typeof post.frontmatter.description).toBe("string");
      expect((post.frontmatter.description as string).trim().length).toBeGreaterThan(0);
    }
  });

  test("every post has a non-empty 'author'", () => {
    for (const post of posts) {
      expect(typeof post.frontmatter.author).toBe("string");
      expect((post.frontmatter.author as string).trim().length).toBeGreaterThan(0);
    }
  });

  test("every post has a 'date' field", () => {
    for (const post of posts) {
      expect(post.frontmatter.date).toBeDefined();
    }
  });

  test("every post has a 'tags' field", () => {
    for (const post of posts) {
      expect(post.frontmatter.tags).toBeDefined();
    }
  });

  test("every post has a 'status' field", () => {
    for (const post of posts) {
      expect(post.frontmatter.status).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------

describe("Date format validation", () => {
  test("every 'date' is in ISO 8601 format (YYYY-MM-DD)", () => {
    for (const post of posts) {
      const date = post.frontmatter.date as string;
      expect(ISO_DATE_RE.test(date)).toBe(true);
    }
  });

  test("every 'date' is a valid calendar date", () => {
    for (const post of posts) {
      const date = post.frontmatter.date as string;
      const parsed = new Date(date);
      // Invalid dates produce NaN from getTime()
      expect(isNaN(parsed.getTime())).toBe(false);
    }
  });

  test("no post has a date in the future (beyond today)", () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (const post of posts) {
      const date = new Date(post.frontmatter.date as string);
      // Allow up to tomorrow to account for timezone differences
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2);
      expect(date.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
    }
  });
});

// ---------------------------------------------------------------------------
// Status validation
// ---------------------------------------------------------------------------

describe("Status field validation", () => {
  test("every 'status' is one of the allowed values", () => {
    for (const post of posts) {
      const status = post.frontmatter.status as string;
      expect(VALID_STATUSES.has(status)).toBe(true);
    }
  });

  test("valid status values are: draft, in-review, approved, published, archived", () => {
    // Document the allowed set — this test always passes but serves as spec
    expect([...VALID_STATUSES].sort()).toEqual([
      "approved",
      "archived",
      "draft",
      "in-review",
      "published",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Tags validation
// ---------------------------------------------------------------------------

describe("Tags field validation", () => {
  test("every 'tags' is an array", () => {
    for (const post of posts) {
      expect(Array.isArray(post.frontmatter.tags)).toBe(true);
    }
  });

  test("every 'tags' array is non-empty", () => {
    for (const post of posts) {
      const tags = post.frontmatter.tags as unknown[];
      expect(tags.length).toBeGreaterThan(0);
    }
  });

  test("every tag is a non-empty string", () => {
    for (const post of posts) {
      const tags = post.frontmatter.tags as unknown[];
      for (const tag of tags) {
        expect(typeof tag).toBe("string");
        expect((tag as string).trim().length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Word count validation
// ---------------------------------------------------------------------------

describe("Word count validation", () => {
  test(`every post body has at least ${MIN_WORD_COUNT} words`, () => {
    for (const post of posts) {
      const wc = countWords(post.body);
      expect(wc).toBeGreaterThanOrEqual(MIN_WORD_COUNT);
    }
  });

  test(`every post body has at most ${MAX_WORD_COUNT} words`, () => {
    for (const post of posts) {
      const wc = countWords(post.body);
      expect(wc).toBeLessThanOrEqual(MAX_WORD_COUNT);
    }
  });
});

// ---------------------------------------------------------------------------
// Per-file named tests (one test per file for targeted failure messages)
// ---------------------------------------------------------------------------

describe("Per-file validation", () => {
  // These run after posts are loaded, so we generate them dynamically.
  // We define them as a loop; Bun's test runner supports this pattern.

  test("each MDX file passes all required checks", () => {
    const failures: string[] = [];

    for (const post of posts) {
      const { filename, frontmatter, body } = post;
      const fm = frontmatter;

      // Required string fields
      for (const field of ["title", "description", "author", "date", "status"] as const) {
        if (typeof fm[field] !== "string" || !(fm[field] as string).trim()) {
          failures.push(`${filename}: '${field}' is missing or empty`);
        }
      }

      // Date format
      if (typeof fm.date === "string" && !ISO_DATE_RE.test(fm.date)) {
        failures.push(`${filename}: date '${fm.date}' is not ISO 8601 format`);
      }

      // Status enum
      if (typeof fm.status === "string" && !VALID_STATUSES.has(fm.status)) {
        failures.push(
          `${filename}: status '${fm.status}' is not one of [${[...VALID_STATUSES].join(", ")}]`
        );
      }

      // Tags array
      if (!Array.isArray(fm.tags)) {
        failures.push(`${filename}: 'tags' must be an array`);
      } else if ((fm.tags as unknown[]).length === 0) {
        failures.push(`${filename}: 'tags' array is empty`);
      }

      // Word count
      const wc = countWords(body);
      if (wc < MIN_WORD_COUNT) {
        failures.push(`${filename}: word count ${wc} is below minimum ${MIN_WORD_COUNT}`);
      }
      if (wc > MAX_WORD_COUNT) {
        failures.push(`${filename}: word count ${wc} exceeds maximum ${MAX_WORD_COUNT}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Content validation failures:\n${failures.map((f) => `  • ${f}`).join("\n")}`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Frontmatter parser unit tests
// ---------------------------------------------------------------------------

describe("Frontmatter parser", () => {
  test("parses quoted strings", () => {
    const result = parseFrontmatter('title: "Hello World"\nauthor: "growth-agent"');
    expect(result.title).toBe("Hello World");
    expect(result.author).toBe("growth-agent");
  });

  test("parses unquoted strings", () => {
    const result = parseFrontmatter("status: published\ndate: 2026-04-08");
    expect(result.status).toBe("published");
    expect(result.date).toBe("2026-04-08");
  });

  test("parses inline arrays", () => {
    const result = parseFrontmatter('tags: ["crm", "churn", "saas"]');
    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.tags).toContain("crm");
    expect(result.tags).toContain("churn");
    expect(result.tags).toContain("saas");
  });

  test("parses arrays without quotes", () => {
    const result = parseFrontmatter("tags: [onboarding, churn, saas]");
    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.tags).toContain("onboarding");
  });
});

describe("Word counter", () => {
  test("counts words in simple text", () => {
    expect(countWords("one two three")).toBe(3);
  });

  test("handles multiple whitespace", () => {
    expect(countWords("  hello   world  ")).toBe(2);
  });

  test("handles newlines and tabs", () => {
    expect(countWords("word1\nword2\tword3")).toBe(3);
  });

  test("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });
});
