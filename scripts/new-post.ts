#!/usr/bin/env bun
/**
 * new-post.ts — ellocharlie-content post scaffolder
 *
 * Creates a new MDX file from template with pre-filled frontmatter.
 *
 * Usage:
 *   bun run new-post                              # Interactive prompts
 *   bun run new-post --title "My Post Title"      # Provide title directly
 *   bun run new-post --title "My Post" --type case-studies
 *
 * Supported types: blog, case-studies, changelog, docs
 */

import { writeFile, mkdir } from "fs/promises";
import { join, existsSync } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, "content");

const VALID_TYPES = ["blog", "case-studies", "changelog", "docs"] as const;
type ContentType = (typeof VALID_TYPES)[number];

const TYPE_REVIEWERS: Record<ContentType, string> = {
  blog: "ceo",
  "case-studies": "ceo",
  changelog: "cto",
  docs: "cto",
};

const TYPE_TAGS: Record<ContentType, string[]> = {
  blog: ["startups"],
  "case-studies": ["customer-success", "case-study"],
  changelog: ["product", "changelog"],
  docs: ["documentation"],
};

/** Convert title to kebab-case slug */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Get today's date as ISO 8601 string */
function today(): string {
  return new Date().toISOString().split("T")[0]!;
}

/** Generate MDX content from parameters */
function generateMDX(title: string, type: ContentType, slug: string): string {
  const reviewer = TYPE_REVIEWERS[type];
  const tags = TYPE_TAGS[type];
  const date = today();
  const canonical = `https://ellocharlie.com/${type}/${slug}`;

  const tagStr = tags.map(t => `"${t}"`).join(", ");

  return `---
title: "${title}"
description: ""
author: "growth-agent"
reviewer: "${reviewer}"
date: "${date}"
tags: [${tagStr}]
status: "draft"
seo:
  keywords: ["keyword 1", "keyword 2"]
  canonical: "${canonical}"
---

{/* TODO: Write your post here. Remove this comment when done. */}
{/* Target word count: ${type === "blog" ? "700–1200" : type === "case-studies" ? "600–1000" : type === "changelog" ? "100–300" : "300–800"} words */}

## Introduction

[Write your opening hook here.]

## [Section Heading]

[Body content goes here.]

## [Section Heading]

[Continue building the argument.]

## Conclusion

[Closing paragraph with CTA.]

[Call to action link text →](https://ellocharlie.com)
`;
}

/** Parse CLI args into key-value map */
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith("--")) {
      const key = args[i]!.slice(2);
      const value = args[i + 1] && !args[i + 1]!.startsWith("--") ? args[i + 1]! : "true";
      result[key] = value;
      if (value !== "true") i++;
    }
  }
  return result;
}

/** Prompt the user for input (stdin) */
async function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  const buf = Buffer.alloc(256);
  const n = Bun.stdin.fd !== undefined
    ? await new Promise<number>((resolve, reject) =>
        (async () => {
          const text = await new Response(Bun.stdin).text();
          const line = text.split("\n")[0] ?? "";
          resolve(line.length);
          // Can't really do interactive stdin this way cleanly in Bun
          // Fallback: use process.stdin
        })()
      )
    : 0;
  return buf.toString("utf-8", 0, n).trim();
}

async function readLine(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise(resolve => {
    let data = "";
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", chunk => {
      data += chunk;
      process.stdin.pause();
      resolve(data.trim().split("\n")[0] ?? "");
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let title = args.title ?? "";
  let type = (args.type as ContentType) ?? "";

  // Interactive prompts if not provided via args
  if (!title) {
    title = await readLine("Post title: ");
  }

  if (!title) {
    console.error("Error: title is required.");
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type as ContentType)) {
    if (args.type) {
      console.error(`Error: unknown type "${args.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
      process.exit(1);
    }
    const typeInput = await readLine(`Content type [${VALID_TYPES.join(" | ")}] (default: blog): `);
    type = (typeInput || "blog") as ContentType;
    if (!VALID_TYPES.includes(type)) {
      console.error(`Error: invalid type "${type}"`);
      process.exit(1);
    }
  }

  const slug = args.slug ?? slugify(title);
  const dir = join(CONTENT_DIR, type);
  const filePath = join(dir, `${slug}.mdx`);

  if (existsSync(filePath)) {
    console.error(`Error: file already exists: ${filePath}`);
    process.exit(1);
  }

  await mkdir(dir, { recursive: true });
  const content = generateMDX(title, type as ContentType, slug);
  await writeFile(filePath, content, "utf-8");

  console.log(`\n✅ Created: content/${type}/${slug}.mdx`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open content/${type}/${slug}.mdx and write your content`);
  console.log(`  2. Fill in "description" and "seo.keywords" in frontmatter`);
  console.log(`  3. Run "bun run validate" to check your work`);
  console.log(`  4. Set status to "review" when ready for sign-off`);
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
