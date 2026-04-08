#!/usr/bin/env bun
/**
 * validate.ts — ellocharlie-content validation script
 *
 * Checks:
 *   1. All required frontmatter fields are present and correctly typed
 *   2. No broken internal links (links to other content/ files)
 *   3. Word count is within acceptable range for content type
 *   4. Status values are valid
 *   5. Date format is ISO 8601 (YYYY-MM-DD)
 *
 * Usage: bun run validate
 */

import { readdir, readFile } from "fs/promises";
import { join, relative, extname, basename, dirname } from "path";
import { existsSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "content");

// Word count targets per content type
const WORD_COUNT_RANGES: Record<string, [number, number]> = {
  blog: [700, 1200],
  "case-studies": [600, 1000],
  changelog: [100, 300],
  docs: [300, 800],
};

const REQUIRED_FIELDS = ["title", "description", "author", "reviewer", "date", "tags", "status"];
const REQUIRED_SEO_FIELDS = ["keywords", "canonical"];
const VALID_STATUSES = ["draft", "review", "approved", "published"];
const VALID_REVIEWERS = ["ceo", "cto"];
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
  passed: boolean;
}

/** Parse YAML frontmatter */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const yamlStr = match[1];
  const body = match[2];
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlStr.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const value = keyMatch[2].trim();

    if (value === "" && lines[i + 1]?.match(/^\s{2,}/)) {
      const nested: Record<string, unknown> = {};
      i++;
      while (i < lines.length && lines[i].match(/^\s{2,}/)) {
        const nestedMatch = lines[i].match(/^\s+(\w[\w-]*):\s*(.*)/);
        if (nestedMatch) {
          const nKey = nestedMatch[1];
          const nVal = nestedMatch[2].trim();
          if (nVal.startsWith("[")) {
            nested[nKey] = nVal.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
          } else {
            nested[nKey] = nVal.replace(/^["']|["']$/g, "");
          }
        }
        i++;
      }
      frontmatter[key] = nested;
      continue;
    }

    if (value.startsWith("[")) {
      frontmatter[key] = value.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      frontmatter[key] = value.replace(/^["']|["']$/g, "");
    }
    i++;
  }

  return { frontmatter, body };
}

/** Count words in markdown body */
function countWords(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[*_~]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}

/** Extract internal links from body (links starting with / or ./content/) */
function extractInternalLinks(body: string): string[] {
  const linkRegex = /\[.*?\]\((\/[^)]*|\.\.?\/[^)]*)\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    links.push(match[1]);
  }
  return links;
}

/** Find all MDX files recursively */
async function findMDXFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findMDXFiles(fullPath));
    } else if (entry.isFile() && extname(entry.name) === ".mdx") {
      results.push(fullPath);
    }
  }
  return results;
}

/** Derive content type from path */
function deriveType(filePath: string): string {
  return relative(CONTENT_DIR, filePath).split("/")[0] ?? "unknown";
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const rel = relative(ROOT, filePath);
  const errors: string[] = [];
  const warnings: string[] = [];

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return { file: rel, errors: ["Could not read file"], warnings: [], passed: false };
  }

  // 1. Frontmatter presence
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    return {
      file: rel,
      errors: ["Missing or malformed frontmatter (must start with ---)"],
      warnings: [],
      passed: false,
    };
  }

  const { frontmatter, body } = parsed;

  // 2. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === "") {
      errors.push(`Missing required frontmatter field: "${field}"`);
    }
  }

  // 3. SEO block
  const seo = frontmatter.seo as Record<string, unknown> | undefined;
  if (!seo) {
    errors.push('Missing required frontmatter block: "seo"');
  } else {
    for (const field of REQUIRED_SEO_FIELDS) {
      if (!seo[field]) {
        errors.push(`Missing required SEO field: "seo.${field}"`);
      }
    }

    // Canonical URL check
    if (seo.canonical && typeof seo.canonical === "string" && !seo.canonical.startsWith("https://")) {
      errors.push(`seo.canonical must be a full HTTPS URL, got: "${seo.canonical}"`);
    }
  }

  // 4. Status validation
  if (frontmatter.status && !VALID_STATUSES.includes(frontmatter.status as string)) {
    errors.push(`Invalid status "${frontmatter.status}". Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  // 5. Reviewer validation
  if (frontmatter.reviewer && !VALID_REVIEWERS.includes(frontmatter.reviewer as string)) {
    warnings.push(`Unusual reviewer "${frontmatter.reviewer}". Expected: ${VALID_REVIEWERS.join(", ")}`);
  }

  // 6. Date format
  if (frontmatter.date && !ISO_DATE_REGEX.test(frontmatter.date as string)) {
    errors.push(`"date" must be ISO 8601 format (YYYY-MM-DD), got: "${frontmatter.date}"`);
  }

  // 7. Tags
  const tags = frontmatter.tags;
  if (Array.isArray(tags)) {
    if (tags.length < 2) warnings.push("Post has fewer than 2 tags");
    if (tags.length > 6) warnings.push("Post has more than 6 tags");
    for (const tag of tags) {
      if (tag !== tag.toLowerCase()) {
        errors.push(`Tag "${tag}" must be lowercase`);
      }
    }
  }

  // 8. Title length
  const title = frontmatter.title as string | undefined;
  if (title && title.length > 70) {
    warnings.push(`Title is ${title.length} chars (recommended max: 70 for SEO)`);
  }

  // 9. Description length
  const desc = frontmatter.description as string | undefined;
  if (desc) {
    if (desc.length < 120) warnings.push(`Description is ${desc.length} chars (recommended: 120–160)`);
    if (desc.length > 160) warnings.push(`Description is ${desc.length} chars (recommended: 120–160)`);
  }

  // 10. Word count
  const contentType = deriveType(filePath);
  const wordCount = countWords(body);
  const range = WORD_COUNT_RANGES[contentType];
  if (range) {
    const [min, max] = range;
    if (wordCount < min) {
      warnings.push(`Word count ${wordCount} is below minimum ${min} for type "${contentType}"`);
    } else if (wordCount > max) {
      warnings.push(`Word count ${wordCount} exceeds maximum ${max} for type "${contentType}"`);
    }
  }

  // 11. Internal link validation
  const internalLinks = extractInternalLinks(body);
  for (const link of internalLinks) {
    // Only validate relative content links, skip external
    if (link.startsWith("/content/") || link.startsWith("./")) {
      const resolved = link.startsWith("./")
        ? join(dirname(filePath), link)
        : join(ROOT, link);
      if (!existsSync(resolved)) {
        errors.push(`Broken internal link: "${link}"`);
      }
    }
  }

  return {
    file: rel,
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

async function main() {
  console.log("🔍 ellocharlie-content validation\n");

  const mdxFiles = await findMDXFiles(CONTENT_DIR);
  console.log(`Validating ${mdxFiles.length} MDX file(s)...\n`);

  const results = await Promise.all(mdxFiles.map(validateFile));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    const status = result.passed ? "✓" : "✗";
    const warnSuffix = result.warnings.length > 0 ? ` (${result.warnings.length} warning(s))` : "";
    console.log(`  ${status} ${result.file}${warnSuffix}`);

    for (const err of result.errors) {
      console.error(`      ERROR: ${err}`);
      totalErrors++;
    }
    for (const warn of result.warnings) {
      console.warn(`      WARN:  ${warn}`);
      totalWarnings++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Files: ${results.length}  |  Passed: ${results.filter(r => r.passed).length}  |  Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Errors: ${totalErrors}  |  Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.error(`\n❌ Validation failed with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ Validation passed.");
  }
}

main().catch(err => {
  console.error("Validation script failed:", err);
  process.exit(1);
});
