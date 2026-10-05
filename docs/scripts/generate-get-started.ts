/**
 * Generates the docs site's Get Started page from the repository README.
 *
 * To change the page, edit the README and rerun this script. The page is the
 * README with a few changes for the site, like showing the installation
 * options as tabs. Each change is a remark plugin below; `processor`,
 * at the end of the file, applies them in order.
 *
 * Run from `docs/`: npm run generate-get-started
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join as joinPathPosix } from 'node:path/posix';
import { fileURLToPath } from 'node:url';

import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { toMarkdown } from 'mdast-util-to-markdown';
import { headingRange } from 'mdast-util-heading-range';
import type { Code, Heading, Paragraph, PhrasingContent, Root, RootContent } from 'mdast';

const README = new URL('../../README.md', import.meta.url);
const SRC_DIR = new URL('../docs/', import.meta.url);
const OUTPUT = new URL('get-started.md', SRC_DIR);

const SITE_ORIGIN = 'https://keyframekit.berryscript.com';
const REPO_BLOB_URL = 'https://github.com/barhatsor/KeyframeKit/blob/main/';


function addFrontmatter(yaml: string) {
  return (tree: Root) => {
    tree.children.unshift({ type: 'yaml', value: yaml });
  };
}

/**
 * The README title links to the site and shows the logo.
 * On the site itself, the title is plain text.
 */
function plainTitle() {
  return (tree: Root) => {
    const title = tree.children.find(
      (node): node is Heading => node.type === 'heading' && node.depth === 1
    );
    if (title === undefined)
      throw new Error('README has no title heading');

    const text = toString(title, { includeHtml: false }).trim();
    title.children = [{ type: 'text', value: text }];
  };
}

/**
 * Adds attributes (markdown-it-attrs syntax) to the badges paragraph.
 * VitePress displays images as blocks, so the site styles this CSS class to lay badges out in a row.
 */
function tagBadges(attrs: string) {
  return (tree: Root) => {
    const badges = tree.children.find(isBadgesParagraph);
    if (badges === undefined)
      throw new Error('README has no badges paragraph');

    // raw, so attribute values aren't escaped as Markdown (`*` → `\*`)
    badges.children.push({ type: 'html', value: '\n' + attrs });
  };
}

/** A paragraph of badges, one per line. */
function isBadgesParagraph(node: RootContent): node is Paragraph {
  const isNewline = (child: PhrasingContent) =>
    child.type === 'text' && child.value === '\n';

  return node.type === 'paragraph'
    && node.children.some(isBadge)
    && node.children.every(child => isBadge(child) || isNewline(child));
}

/** A linked image, like `[![NPM version][npm-version-src]][npm-version-href]`. */
function isBadge(node: PhrasingContent) {
  const isLink = node.type === 'link' || node.type === 'linkReference';
  const isImage = (child: PhrasingContent) =>
    child.type === 'image' || child.type === 'imageReference';

  return isLink
    && node.children.length === 1
    && isImage(node.children[0]!);
}

/**
 * Collapses a section of `### Label` subsections, each holding optional prose
 * followed by a code block, into a VitePress code group:
 *
 *   ### CDN
 *   Import the module directly:
 *   ```js
 *   import …
 *   ```
 *
 * becomes
 *
 *   ::: code-group
 *
 *   ```js [CDN]
 *   /* Import the module directly: *\/
 *   import …
 *   ```
 *
 *   :::
 */
function codeGroup(sectionTitle: string) {
  return (tree: Root) => {
    let found = false;

    headingRange(tree, sectionTitle, (start, nodes, end) => {
      found = true;

      const subsections: { label: string, prose: string[], code?: Code }[] = [];

      for (const node of nodes) {
        if (node.type === 'heading') {
          subsections.push({ label: toString(node), prose: [] });
          continue;
        }

        const subsection = subsections.at(-1);
        if (subsection === undefined)
          throw new Error(`"${sectionTitle}" section must start with a subsection heading`);
        if (subsection.code !== undefined)
          throw new Error(`"${subsection.label}" subsection in "${sectionTitle}" must end with its code block`);

        switch (node.type) {
          case 'paragraph':
            // as Markdown, so the comment keeps inline code and links
            const markdown = toMarkdown(node).trimEnd();
            subsection.prose.push(...markdown.split('\n'));
            break;
          case 'code':
            subsection.code = node;
            break;
          default:
            throw new Error(`Unexpected ${node.type} in "${sectionTitle}" section`);
        }
      }

      const codes = subsections.map(({ label, prose, code }): Code => {
        if (code === undefined)
          throw new Error(`"${label}" subsection in "${sectionTitle}" has no code block`);

        const comments = prose.map(
          line => wrapInComment(line, code.lang ?? '')
        );

        return {
          ...code,
          meta: `[${label}]`,
          value: [...comments, code.value].join('\n')
        };
      });

      return [
        start,
        { type: 'html', value: '::: code-group' },
        ...codes,
        { type: 'html', value: ':::' },
        end
      ];
    });

    if (!found)
      throw new Error(`README has no "${sectionTitle}" section`);
  };
}

/** Wraps a line of prose in a comment, per code block language. */
const COMMENT_SYNTAX: Record<string, (text: string) => string> = {
  js: text => `/* ${text} */`,
  ts: text => `/* ${text} */`,
  css: text => `/* ${text} */`,
  sh: text => `# ${text}`
};

function wrapInComment(text: string, lang: string) {
  const comment = COMMENT_SYNTAX[lang];
  if (comment === undefined)
    throw new Error(`No comment syntax for code block language "${lang}"`);

  return comment(text);
}

/**
 * Rewrites URLs for the site:
 * - Site URLs become site-relative (`https://keyframekit.berryscript.com/reference` → `/reference/`).
 * - Repository-relative URLs point to GitHub (`./LICENSE` → `https://github.com/…/blob/main/LICENSE`).
 */
function rewriteUrls() {
  return (tree: Root) => {
    visit(tree, ['definition', 'link'] as const, node => {
      node.url = siteUrl(node.url);
    });
  };
}

function siteUrl(url: string) {
  if (url.startsWith('#'))
    return url;

  // like GitHub, resolve README-relative and root-relative URLs against the repository root
  // (`./LICENSE` and `/LICENSE` both become `LICENSE`)
  if (!URL.canParse(url))
    return new URL(joinPathPosix('.', url), REPO_BLOB_URL).href;

  const { origin, pathname, search, hash } = new URL(url);
  if (origin !== SITE_ORIGIN)
    return url;

  let path = pathname;

  // with cleanUrls, a page's directory index is only served at its trailing-slash URL
  const indexPage = new URL(`.${path}/index.md`, SRC_DIR);
  if (!path.endsWith('/') && existsSync(indexPage))
    path += '/';

  return path + search + hash;
}

/** Removes definitions left unreferenced by the plugins above, like the README title's site link. */
function removeUnusedDefinitions() {
  return (tree: Root) => {
    const used = new Set<string>();

    visit(tree, ['linkReference', 'imageReference'] as const, node => {
      used.add(node.identifier);
    });

    tree.children = tree.children.filter(
      node => node.type !== 'definition' || used.has(node.identifier)
    );
  };
}


const processor = remark()
  .data('settings', { tightDefinitions: true })
  .use(remarkFrontmatter)
  .use(addFrontmatter, [
    'title: Get Started',
    `# Generated from /README.md by scripts/generate-get-started.ts. Edit the README instead.`
  ].join('\n'))
  .use(plainTitle)
  .use(tagBadges, '{class=badges}')
  .use(codeGroup, 'Installation')
  .use(rewriteUrls)
  .use(removeUnusedDefinitions);

const readme = await readFile(README, 'utf8');
const output = await processor.process(readme);

await writeFile(OUTPUT, String(output));
console.log(`Wrote ${fileURLToPath(OUTPUT)}`);
