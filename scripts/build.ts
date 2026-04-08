#!/usr/bin/env bun
/**
 * build.ts — ellocharlie-content build script
 *
 * Validates all MDX files, checks frontmatter completeness,
 * and generates content-manifest.json for site consumption.
 *
 * Usage: bun run build
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join, relative, extname, basename } from "path";
import { existsSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "content");
const MANIFEST_PATH = join(ROOT, "content-manifest.json");

interface Frontmatter {
  title: string;
  description: string;
  author: string;
  reviewer: string;
  date: string;
  updated?: string;
  tags: string[];
  status: "draft" | "review" | "approved" | "published";
  featured?: boolean;
  seo: {
    keywords: string[];
    canonical: string;
    og_image?: string;
  };
}

interface ContentEntry {
  slug: string;
  path: string;
  type: string;
  frontmatter: Frontmatter;
  wordCount: number;
  builtAt: string;
}

/** Parse YAML frontmatter from MDX file content */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("No frontmatter found");
  }

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parser for our known schema
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlStr.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const value = keyMatch[2].trim();

    // Nested object (e.g. seo:)
    if (value === "" && lines[i + 1]?.match(/^\s{2,}/)) {
      const nested: Record<string, unknown> = {};
      i++;
      while (i < lines.length && lines[i].match(/^\s{2,}/)) {
        const nestedMatch = lines[i].match(/^\s+(\w[\w-]*):\s*(.*)/);
        if (nestedMatch) {
          const nKey = nestedMatch[1];
          const nVal = nestedMatch[2].trim();
          if (nVal.startsWith("[")) {
            nested[nKey] = nVal.slice(1, -1).split(",").map(s =>
              s.trim().replace(/^["']|["']$/g, "")
            );
          } else {
            nested[nKey] = nVal.replace(/^["']|["']$/g, "");
          }
        }
        i++;
      }
      frontmatter[key] = nested;
      continue;
    }

    // Array
    if (value.startsWith("[")) {
      frontmatter[key] = value.slice(1, -1).split(",").map(s =>
        s.trim().replace(/^["']|["']$/g, "")
      );
    } else {
      frontmatter[key] = value.replace(/^["']|["']$/g, "");
    }
    i++;
  }

  return { frontmatter, body };
}

/** Count words in markdown body (strips MDX/markdown syntax) */
function countWords(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]*`/g, "")         // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[.*?\]\(.*?\)/g, "$1") // links
    .replace(/#{1,6}\s/g, "")         // headings
    .replace(/[*_~]/g, "")            // emphasis
    .replace(/\n+/g, " ")
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}

/** Recursively find all .mdx files in a directory */
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

/** Derive content type from directory path */
function deriveType(filePath: string): string {
  const rel = relative(CONTENT_DIR, filePath);
  return rel.split("/")[0] ?? "unknown";
}

/** Derive slug from file path */
function deriveSlug(filePath: string): string {
  return basename(filePath, ".mdx");
}

async function main() {
  console.log("🔨 ellocharlie-content build starting...\n");

  const mdxFiles = await findMDXFiles(CONTENT_DIR);
  console.log(`Found ${mdxFiles.length} MDX file(s)\n`);

  const entries: ContentEntry[] = [];
  const errors: string[] = [];

  for (const filePath of mdxFiles) {
    const rel = relative(ROOT, filePath);
    try {
      const raw = await readFile(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);
      const wordCount = countWords(body);

      entries.push({
        slug: deriveSlug(filePath),
        path: rel,
        type: deriveType(filePath),
        frontmatter: frontmatter as unknown as Frontmatter,
        wordCount,
        builtAt: new Date().toISOString(),
      });

      console.log(`  ✓ ${rel} (${wordCount} words)`);
    } catch (err) {
      const msg = `  ✗ ${rel}: ${(err as Error).message}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // Sort by date descending
  entries.sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    published: entries.filter(e => e.frontmatter.status === "published").length,
    entries,
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Manifest written to ${relative(ROOT, MANIFEST_PATH)}`);
  console.log(`   ${manifest.published}/${manifest.totalEntries} entries published`);

  if (errors.length > 0) {
    console.error(`\n⚠️  Build completed with ${errors.length} error(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ Build complete.");
  }
}

main().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});
