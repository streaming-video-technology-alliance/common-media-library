# Consolidated Site Implementation Plan (phases 1 and 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `docs/` TypeDoc workspace with a `site/` VitePress workspace. One command builds the landing page, package pages, guides, API reference, releases feed, and redirect stubs.

**Architecture:** `site/scripts/prepare.ts` copies every published package's README, guides, and changelog into `site/packages/`. It also writes `packages.json`, the package index, the releases feed, and the TypeDoc entry list. TypeDoc with `typedoc-plugin-markdown` and `typedoc-vitepress-theme` writes the API reference into `site/api/`. A ten-line TypeDoc plugin renames modules to folder names. VitePress builds `site/dist`, `writeRedirects.ts` adds stubs for the old URLs, and `check.ts` verifies the output.

**Tech Stack:** Node 24 (runs `.ts` files directly), VitePress 1.6.4, TypeDoc 0.28.15, typedoc-plugin-markdown 4.14.1, typedoc-vitepress-theme 1.1.4, `node --test`.

## Global Constraints

- Node >= 24. Scripts are `.ts` files that `node` runs directly. No compile step for scripts.
- Code style, enforced by `npm run lint`: tabs, single quotes, no semicolons, `import type` for types. No enums, namespaces, or parameter properties (`erasableSyntaxOnly`). Import local `.ts` files with the `.ts` extension. Index-signature access uses brackets: `process.env['SITE_BASE']`, `attributes['title']`.
- Prose style for every `.md` file, changelog entry, and commit message: sentences under 20 words, no semicolons, no em dashes, active voice, no idioms.
- Commits: `git commit -s`, Conventional Commits, and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Work on branch `claude/consolidated-website-docs-d6f49f`. Never commit to `main`.
- New root devDependencies, exact versions: `vitepress` `1.6.4`, `typedoc-plugin-markdown` `4.14.1`, `typedoc-vitepress-theme` `1.1.4`. No other new dependencies.
- Hand-written site content is only `site/index.md` and `site/guide/getting-started.md`. Everything under `site/packages/`, `site/releases/`, `site/api/`, and `site/api-entry.json` is generated and gitignored.
- Site base path comes from `SITE_BASE`, default `/`. Workflows set `/common-media-library/`.
- No analytics, no third-party requests, no web fonts.
- The published package list comes from `scripts/projects.ts`. `libs/mse` is unpublished and never appears on the site.
- Every task ends with `npm run lint` and `npm run typecheck` passing from the repo root.

## Spike results (phase 1, done 2026-10-22)

Measured in a scratch folder with cmcd, iso-bmff, and utils:

| Measure | Result |
| --- | --- |
| TypeDoc markdown run, 3 packages, 503 pages | 14 s |
| VitePress build, 505 pages | 15 s |
| Local search index, full API pages | 877 KB |
| Local search index, titles only, 178 pages | 35 KB |
| One HTML page with a 500-entry sidebar | 258 KB |

Facts the tasks rely on:

- The packages strategy names each module after its package, so TypeDoc writes `api/@svta/cml-cmcd/`. A plugin renames the modules on `Application.EVENT_VALIDATE_PROJECT`. That event fires after `{@link}` resolution and before URLs are built. `EVENT_PROJECT_REVIVE` is too early: cross-package links such as `@svta/cml-utils!HttpRequest` then fail to resolve.
- TypeDoc loads a `.ts` plugin from a relative path when the nearest `package.json` has `"type": "module"`.
- Output per package: `api/<pkg>/index.md` plus `classes/`, `enumerations/`, `functions/`, `type-aliases/`, `variables/`. Links are relative and stay valid after the rename. `{@includeCode}` renders.
- `typedoc-sidebar.json` is an array with one item per package: `{ "text": "cmcd", "link": "/api/cmcd/", "collapsed": true, "items": [...] }`. Member links end in `.md`, which VitePress converts.
- TypeDoc reads `"extends": ["./api-entry.json"]` and resolves the entry points in that file relative to it.
- VitePress 1.6.4: `import.meta.url` inside `.vitepress/config.ts` points at the original file. The local search hook is `_render(src, env, md)` with a synchronous `md.render`. `vitepress build` fails on dead links by default.
- Old site URLs: `<dir>/_svta_cml-<pkg>.<Symbol>.html` with dirs `classes`, `enums`, `functions`, `types`, `variables`. Package pages at `modules/_svta_cml-<pkg>.html`. Guides at `documents/_svta_cml-<pkg>.<Title>.html` where spaces and `/` in the frontmatter title become `_`. Root pages `index.html`, `modules.html`, `hierarchy.html`. 1,083 pages in total. Six symbol names exist in two packages, so the package prefix must stay in the mapping.
- The current `docs` build emits 19 warnings, 18 of them "glob libs/<pkg>/docs/*.md did not match any files". The new config has no `projectDocuments`, so these disappear.
- Relative links in package READMEs today: only `docs/<file>.md` (iso-bmff). Links between guides are sibling links such as `vsi-validation.md#anchor` and `./user-guide.md#custom-keys`. Copying a `docs/` folder as a whole keeps them valid.
- Every guide has frontmatter with `title` and `description`. Every `libs/*/package.json` has a `description`.

## File Structure

Create:

- `site/package.json`: workspace manifest and the build chain.
- `site/typedoc.json`: TypeDoc options, extends the generated entry list.
- `site/index.md`: landing page, home layout.
- `site/guide/getting-started.md`: the one phase 2 guide.
- `site/public/favicon.png`: moved from `docs/favicon3-150x150.png`.
- `site/.vitepress/config.ts`: nav, sidebar, search, base path.
- `site/.vitepress/theme/index.js` and `custom.css`: default theme plus `tab-size: 2`.
- `site/scripts/frontmatter.ts`: parse a frontmatter block.
- `site/scripts/links.ts`: rewrite README guide links.
- `site/scripts/changelog.ts`: parse and render releases.
- `site/scripts/groups.ts`: package group map.
- `site/scripts/packages.ts`: load package info and render the package index.
- `site/scripts/prepare.ts`: runner that generates all pages and data files.
- `site/scripts/typedocModuleNames.ts`: TypeDoc plugin.
- `site/scripts/searchExcerpt.ts`: trim API pages for the search index.
- `site/scripts/redirects.ts`: compute old-to-new URL pairs and the stub HTML.
- `site/scripts/writeRedirects.ts`: runner that writes the stubs into `dist`.
- `site/scripts/check.ts`: smoke check of `dist`.
- `site/scripts/*.test.ts`: one test file per pure module.
- `.github/workflows/site.pr.yml`: pull request build.

Modify:

- `package.json`: workspaces, `docs` script, devDependencies.
- `.gitignore`, `eslint.config.ts`.
- `.github/workflows/docs.yml`, `publish.yml`, `publish-package.yml`.
- `README.md` project structure paragraph, `AGENTS.md` build commands and documentation, root `CHANGELOG.md` unreleased section.

Delete: `docs/` (package.json, typedoc.json, tsconfig.json, styles.css, favicon3-150x150.png).

---

### Task 1: Workspace scaffold

**Files:**
- Create: `site/package.json`, `site/.vitepress/theme/index.js`, `site/.vitepress/theme/custom.css`, `site/public/favicon.png`
- Modify: `package.json`, `.gitignore`, `eslint.config.ts`
- Delete: `docs/`

**Interfaces:**
- Produces: the `site` workspace with `npm test -w site` wired to `node --test scripts/*.test.ts`. Later tasks add scripts to the `build` chain.

- [ ] **Step 1: Create the workspace manifest**

```json
{
	"name": "@svta/common-media-library-site",
	"private": true,
	"version": "1.0.0",
	"license": "Apache-2.0",
	"type": "module",
	"homepage": "https://github.com/streaming-video-technology-alliance/common-media-library",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/streaming-video-technology-alliance/common-media-library.git"
	},
	"bugs": {
		"url": "https://github.com/streaming-video-technology-alliance/common-media-library/issues"
	},
	"scripts": {
		"build": "node scripts/prepare.ts && typedoc && vitepress build && node scripts/writeRedirects.ts && node scripts/check.ts",
		"dev": "node scripts/prepare.ts && typedoc && vitepress dev",
		"start": "npm run dev",
		"test": "node --no-warnings --test scripts/*.test.ts"
	}
}
```

The `build` chain references scripts that later tasks create. Do not run `npm run build -w site` before Task 9.

- [ ] **Step 2: Create the theme entry and the custom CSS**

`site/.vitepress/theme/index.js`:

```js
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default DefaultTheme
```

`site/.vitepress/theme/custom.css`:

```css
pre,
code {
	tab-size: 2;
}
```

- [ ] **Step 3: Move the favicon and delete the docs workspace**

```bash
mkdir -p site/public
git mv docs/favicon3-150x150.png site/public/favicon.png
git rm -r docs
```

- [ ] **Step 4: Update the root package.json**

Replace `"docs"` with `"site"` in `workspaces`. Change the `docs` script to `"docs": "npm start -w site"`. Add to `devDependencies`, keeping alphabetical order:

```json
"typedoc-plugin-markdown": "4.14.1",
"typedoc-vitepress-theme": "1.1.4",
"vitepress": "1.6.4",
```

Then run `npm install` from the repo root. Commit the updated `package-lock.json`.

- [ ] **Step 5: Ignore generated folders and the VitePress cache**

Append to `.gitignore`:

```
site/api/
site/api-entry.json
site/packages/
site/releases/
.vitepress/cache/
```

In `eslint.config.ts`, change `ignores: ['**/dist']` to `ignores: ['**/dist', '**/.vitepress/cache']`.

- [ ] **Step 6: Verify**

Run from the repo root:

```bash
npm run lint && npm run typecheck && npm test -w site
```

Expected: lint and typecheck pass. The site test command prints `ℹ tests 0` or fails with "no test files found", both are acceptable until Task 2.

- [ ] **Step 7: Commit**

```bash
git add -A site docs package.json package-lock.json .gitignore eslint.config.ts
git commit -s -m "chore(site): replace the docs workspace with a VitePress site workspace"
```

---

### Task 2: Frontmatter and link helpers

**Files:**
- Create: `site/scripts/frontmatter.ts`, `site/scripts/frontmatter.test.ts`, `site/scripts/links.ts`, `site/scripts/links.test.ts`

**Interfaces:**
- Produces: `parseFrontmatter(markdown: string): Frontmatter` where `Frontmatter = { attributes: Record<string, string>; body: string }`. `rewriteReadmeLinks(markdown: string): string`.

- [ ] **Step 1: Write the failing frontmatter tests**

`site/scripts/frontmatter.test.ts`:

```ts
import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseFrontmatter } from './frontmatter.ts'

describe('parseFrontmatter', () => {
	it('returns the attributes and the body', () => {
		const result = parseFrontmatter('---\ntitle: User Guide\ndescription: How to use it\n---\n\n# Heading\n')
		deepEqual(result.attributes, { title: 'User Guide', description: 'How to use it' })
		equal(result.body, '\n# Heading\n')
	})

	it('strips quotes around a value', () => {
		const result = parseFrontmatter('---\ntitle: "VSI/EMSG Validation"\n---\nbody')
		equal(result.attributes['title'], 'VSI/EMSG Validation')
	})

	it('returns no attributes when there is no block', () => {
		const result = parseFrontmatter('# Heading\n')
		deepEqual(result.attributes, {})
		equal(result.body, '# Heading\n')
	})

	it('keeps a colon inside the value', () => {
		const result = parseFrontmatter('---\ndescription: Note: read this\n---\n')
		equal(result.attributes['description'], 'Note: read this')
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test site/scripts/frontmatter.test.ts`
Expected: FAIL, cannot find module `./frontmatter.ts`.

- [ ] **Step 3: Implement frontmatter.ts**

```ts
const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export type Frontmatter = {
	attributes: Record<string, string>;
	body: string;
}

// Parses a frontmatter block of `key: value` lines. Nested YAML is not supported.
export function parseFrontmatter(markdown: string): Frontmatter {
	const match = block.exec(markdown)

	if (!match) {
		return { attributes: {}, body: markdown }
	}

	const attributes: Record<string, string> = {}

	for (const line of match[1].split(/\r?\n/)) {
		const colon = line.indexOf(':')

		if (colon > 0) {
			const key = line.slice(0, colon).trim()
			const value = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '')
			attributes[key] = value
		}
	}

	return { attributes, body: markdown.slice(match[0].length) }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test site/scripts/frontmatter.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Write the failing link tests**

`site/scripts/links.test.ts`:

```ts
import { equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rewriteReadmeLinks } from './links.ts'

describe('rewriteReadmeLinks', () => {
	it('points a docs link at the guides folder', () => {
		equal(rewriteReadmeLinks('[Reading boxes](docs/reading-boxes.md)'), '[Reading boxes](guides/reading-boxes.md)')
	})

	it('accepts a leading ./ and keeps the anchor', () => {
		equal(rewriteReadmeLinks('[Keys](./docs/user-guide.md#custom-keys)'), '[Keys](guides/user-guide.md#custom-keys)')
	})

	it('leaves other links unchanged', () => {
		const markdown = '[Spec](https://example.com/docs/spec.md) and [Changelog](CHANGELOG.md)'
		equal(rewriteReadmeLinks(markdown), markdown)
	})

	it('rewrites every link in the text', () => {
		const result = rewriteReadmeLinks('[A](docs/a.md), [B](docs/b.md)')
		equal(result, '[A](guides/a.md), [B](guides/b.md)')
	})
})
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `node --test site/scripts/links.test.ts`
Expected: FAIL, cannot find module `./links.ts`.

- [ ] **Step 7: Implement links.ts**

```ts
const docsLink = /\]\((?:\.\/)?docs\/([^)#]+\.md)(#[^)]*)?\)/g

// A README links to its guides as `docs/<file>.md`. The site serves them from `guides/`.
export function rewriteReadmeLinks(markdown: string): string {
	return markdown.replace(docsLink, (_match, file: string, hash: string | undefined) => `](guides/${file}${hash ?? ''})`)
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `node --test site/scripts/links.test.ts`
Expected: 4 passing.

- [ ] **Step 9: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/scripts/frontmatter.ts site/scripts/frontmatter.test.ts site/scripts/links.ts site/scripts/links.test.ts
git commit -s -m "feat(site): add frontmatter and README link helpers"
```

---

### Task 3: Changelog parsing and the releases feed

**Files:**
- Create: `site/scripts/changelog.ts`, `site/scripts/changelog.test.ts`

**Interfaces:**
- Produces: `type Release = { package: string; folder: string; version: string; date: string }`, `parseReleases(changelog: string, pkg: { name: string; folder: string }): Release[]`, `sortReleases(releases: Release[]): Release[]`, `renderReleases(releases: Release[]): string`.

- [ ] **Step 1: Write the failing tests**

```ts
import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseReleases, renderReleases, sortReleases, type Release } from './changelog.ts'

const pkg = { name: '@svta/cml-cmcd', folder: 'cmcd' }

const changelog = `# Changelog

## [Unreleased]

### Changed

- Pending

## [2.8.3] - 2026-10-18

### Changed

- Something

## [2.8.2] - 2026-10-08

### Fixed

- Something else

[Unreleased]: https://example.com/compare/cmcd-v2.8.3...HEAD
`

describe('parseReleases', () => {
	it('returns one release per version heading and skips Unreleased', () => {
		deepEqual(parseReleases(changelog, pkg), [
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.3', date: '2026-10-18' },
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.2', date: '2026-10-08' },
		])
	})

	it('accepts a prerelease version', () => {
		const releases = parseReleases('## [1.0.0-beta.1] - 2026-01-01\n', pkg)
		equal(releases[0]?.version, '1.0.0-beta.1')
	})
})

describe('sortReleases', () => {
	it('sorts newest first, then by package name', () => {
		const releases: Release[] = [
			{ package: '@svta/cml-utils', folder: 'utils', version: '1.0.0', date: '2026-10-01' },
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.0.0', date: '2026-10-18' },
			{ package: '@svta/cml-abr', folder: 'abr', version: '0.2.0', date: '2026-10-18' },
		]
		deepEqual(sortReleases(releases).map(r => r.package), ['@svta/cml-abr', '@svta/cml-cmcd', '@svta/cml-utils'])
	})
})

describe('renderReleases', () => {
	it('renders a table with one row per release', () => {
		const text = renderReleases([
			{ package: '@svta/cml-cmcd', folder: 'cmcd', version: '2.8.3', date: '2026-10-18' },
		])
		equal(text.startsWith('# Releases\n'), true)
		equal(text.includes('| Date | Package | Version |'), true)
		equal(text.includes('| 2026-10-18 | [@svta/cml-cmcd](/packages/cmcd/changelog) | 2.8.3 |'), true)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test site/scripts/changelog.test.ts`
Expected: FAIL, cannot find module `./changelog.ts`.

- [ ] **Step 3: Implement changelog.ts**

```ts
export type Release = {
	package: string;
	folder: string;
	version: string;
	date: string;
}

const releaseHeading = /^## \[([0-9][^\]]*)\] - (\d{4}-\d{2}-\d{2})/gm

// One release per `## [x.y.z] - YYYY-MM-DD` heading. The Unreleased section has no date and is skipped.
export function parseReleases(changelog: string, pkg: { name: string; folder: string }): Release[] {
	return [...changelog.matchAll(releaseHeading)].map(match => ({
		package: pkg.name,
		folder: pkg.folder,
		version: match[1],
		date: match[2],
	}))
}

// Newest first. Releases on the same day sort by package name.
export function sortReleases(releases: Release[]): Release[] {
	return [...releases].sort((a, b) => b.date.localeCompare(a.date) || a.package.localeCompare(b.package))
}

export function renderReleases(releases: Release[]): string {
	const rows = sortReleases(releases)
		.map(release => `| ${release.date} | [${release.package}](/packages/${release.folder}/changelog) | ${release.version} |`)

	return `# Releases

Every release of every package, newest first. Each link opens the changelog of the package.

| Date | Package | Version |
| --- | --- | --- |
${rows.join('\n')}
`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test site/scripts/changelog.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/scripts/changelog.ts site/scripts/changelog.test.ts
git commit -s -m "feat(site): parse changelogs into a releases feed"
```

---

### Task 4: Package groups, package info, and the package index

**Files:**
- Create: `site/scripts/groups.ts`, `site/scripts/packages.ts`, `site/scripts/packages.test.ts`

**Interfaces:**
- Produces: `type PackageGroup`, `groupOrder: PackageGroup[]`, `groups: Record<string, PackageGroup>`, `type GuideInfo = { slug: string; title: string }`, `type PackageInfo = { folder: string; name: string; version: string; description: string; group: PackageGroup; guides: GuideInfo[] }`, `loadPackage(libsDir: string, folder: string): PackageInfo`, `renderPackageIndex(packages: PackageInfo[]): string`.
- Consumes: `parseFrontmatter` from Task 2.

- [ ] **Step 1: Create groups.ts**

```ts
export type PackageGroup = 'Delivery' | 'Containers' | 'Captions' | 'Trust' | 'Core'

export const groupOrder: PackageGroup[] = ['Delivery', 'Containers', 'Captions', 'Trust', 'Core']

// Every published package needs a group. `loadPackage` fails for a package that is missing here.
export const groups: Record<string, PackageGroup> = {
	'abr': 'Delivery',
	'cmcd': 'Delivery',
	'cmsd': 'Delivery',
	'content-steering': 'Delivery',
	'request': 'Delivery',
	'throughput': 'Delivery',
	'cmaf-ham': 'Containers',
	'dash': 'Containers',
	'id3': 'Containers',
	'iso-bmff': 'Containers',
	'608': 'Captions',
	'cta': 'Captions',
	'webvtt': 'Captions',
	'c2pa': 'Trust',
	'drm': 'Trust',
	'error-codes': 'Core',
	'iso-8601': 'Core',
	'structured-field-values': 'Core',
	'utils': 'Core',
	'xml': 'Core',
}
```

- [ ] **Step 2: Write the failing tests**

```ts
import { deepEqual, equal, throws } from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { loadPackage, renderPackageIndex, type PackageInfo } from './packages.ts'

function fixture(folder: string, guides: Record<string, string> = {}): string {
	const libs = mkdtempSync(path.join(tmpdir(), 'cml-site-'))
	const dir = path.join(libs, folder)
	mkdirSync(dir, { recursive: true })
	writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: `@svta/cml-${folder}`, version: '1.2.3', description: 'Does things' }))

	for (const [file, title] of Object.entries(guides)) {
		mkdirSync(path.join(dir, 'docs'), { recursive: true })
		writeFileSync(path.join(dir, 'docs', file), `---\ntitle: ${title}\n---\n\n# ${title}\n`)
	}

	return libs
}

describe('loadPackage', () => {
	it('reads the manifest and the guide titles in file order', () => {
		const libs = fixture('cmcd', { 'user-guide.md': 'User Guide', 'validation-guide.md': 'Validation Guide' })
		deepEqual(loadPackage(libs, 'cmcd'), {
			folder: 'cmcd',
			name: '@svta/cml-cmcd',
			version: '1.2.3',
			description: 'Does things',
			group: 'Delivery',
			guides: [
				{ slug: 'user-guide', title: 'User Guide' },
				{ slug: 'validation-guide', title: 'Validation Guide' },
			],
		})
	})

	it('returns no guides when the docs folder is missing', () => {
		deepEqual(loadPackage(fixture('utils'), 'utils').guides, [])
	})

	it('fails for a package without a group', () => {
		throws(() => loadPackage(fixture('unknown'), 'unknown'), /no group for "unknown"/)
	})
})

describe('renderPackageIndex', () => {
	it('renders one section per group in group order', () => {
		const packages: PackageInfo[] = [
			{ folder: 'utils', name: '@svta/cml-utils', version: '1.0.0', description: 'Utilities', group: 'Core', guides: [] },
			{ folder: 'cmcd', name: '@svta/cml-cmcd', version: '2.0.0', description: 'CMCD', group: 'Delivery', guides: [] },
		]
		const text = renderPackageIndex(packages)
		equal(text.indexOf('## Delivery') < text.indexOf('## Core'), true)
		equal(text.includes('| [@svta/cml-cmcd](/packages/cmcd/) | 2.0.0 | CMCD |'), true)
		equal(text.includes('## Captions'), false)
	})
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test site/scripts/packages.test.ts`
Expected: FAIL, cannot find module `./packages.ts`.

- [ ] **Step 4: Implement packages.ts**

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter } from './frontmatter.ts'
import { groupOrder, groups, type PackageGroup } from './groups.ts'

export type GuideInfo = {
	slug: string;
	title: string;
}

export type PackageInfo = {
	folder: string;
	name: string;
	version: string;
	description: string;
	group: PackageGroup;
	guides: GuideInfo[];
}

type Manifest = {
	name: string;
	version: string;
	description?: string;
}

function loadGuides(docsDir: string): GuideInfo[] {
	if (!existsSync(docsDir)) {
		return []
	}

	return readdirSync(docsDir)
		.filter(file => file.endsWith('.md'))
		.sort()
		.map((file) => {
			const slug = file.slice(0, -'.md'.length)
			const { attributes } = parseFrontmatter(readFileSync(path.join(docsDir, file), 'utf8'))
			return { slug, title: attributes['title'] ?? slug }
		})
}

export function loadPackage(libsDir: string, folder: string): PackageInfo {
	const dir = path.join(libsDir, folder)
	const manifest: Manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
	const group = groups[folder]

	if (!group) {
		throw new Error(`site/scripts/groups.ts has no group for "${folder}". Add it to one of: ${groupOrder.join(', ')}.`)
	}

	return {
		folder,
		name: manifest.name,
		version: manifest.version,
		description: manifest.description ?? '',
		group,
		guides: loadGuides(path.join(dir, 'docs')),
	}
}

export function renderPackageIndex(packages: PackageInfo[]): string {
	const sections = groupOrder
		.filter(group => packages.some(pkg => pkg.group === group))
		.map((group) => {
			const rows = packages
				.filter(pkg => pkg.group === group)
				.sort((a, b) => a.folder.localeCompare(b.folder))
				.map(pkg => `| [${pkg.name}](/packages/${pkg.folder}/) | ${pkg.version} | ${pkg.description} |`)

			return `## ${group}\n\n| Package | Version | Description |\n| --- | --- | --- |\n${rows.join('\n')}\n`
		})

	return `# Packages\n\nEvery published package, grouped by domain. Open a package for its overview, guides, API reference, and changelog.\n\n${sections.join('\n')}`
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test site/scripts/packages.test.ts`
Expected: 4 passing.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/scripts/groups.ts site/scripts/packages.ts site/scripts/packages.test.ts
git commit -s -m "feat(site): load package info and render the package index"
```

---

### Task 5: The prepare runner

**Files:**
- Create: `site/scripts/prepare.ts`

**Interfaces:**
- Consumes: `rewriteReadmeLinks`, `parseReleases`, `renderReleases`, `loadPackage`, `renderPackageIndex`, and `projects` from `scripts/projects.ts` (an array of folders such as `libs/cmcd`, sorted so peers come first).
- Produces: `site/packages/<pkg>/index.md`, `guides/*.md`, `changelog.md`, `site/packages/packages.json` (a `PackageInfo[]`), `site/packages/index.md`, `site/releases/index.md`, `site/api-entry.json`.

- [ ] **Step 1: Implement prepare.ts**

```ts
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseReleases, renderReleases, type Release } from './changelog.ts'
import { rewriteReadmeLinks } from './links.ts'
import { loadPackage, renderPackageIndex, type PackageInfo } from './packages.ts'

const siteDir = path.resolve(import.meta.dirname, '..')
const root = path.resolve(siteDir, '..')
const libsDir = path.join(root, 'libs')
const packagesDir = path.join(siteDir, 'packages')
const releasesDir = path.join(siteDir, 'releases')

// scripts/projects.ts reads `libs` relative to the working directory.
process.chdir(root)
const { projects } = await import('../../scripts/projects.ts')

rmSync(packagesDir, { recursive: true, force: true })
rmSync(releasesDir, { recursive: true, force: true })
mkdirSync(packagesDir, { recursive: true })
mkdirSync(releasesDir, { recursive: true })

const packages: PackageInfo[] = []
const releases: Release[] = []

for (const project of projects) {
	const folder = path.basename(project)
	const pkg = loadPackage(libsDir, folder)
	const source = path.join(libsDir, folder)
	const target = path.join(packagesDir, folder)

	mkdirSync(target, { recursive: true })

	const readme = readFileSync(path.join(source, 'README.md'), 'utf8')
	writeFileSync(path.join(target, 'index.md'), rewriteReadmeLinks(readme))

	const changelog = readFileSync(path.join(source, 'CHANGELOG.md'), 'utf8')
	writeFileSync(path.join(target, 'changelog.md'), changelog)

	if (pkg.guides.length > 0) {
		cpSync(path.join(source, 'docs'), path.join(target, 'guides'), { recursive: true })
	}

	packages.push(pkg)
	releases.push(...parseReleases(changelog, pkg))
}

writeFileSync(path.join(packagesDir, 'packages.json'), `${JSON.stringify(packages, null, '\t')}\n`)
writeFileSync(path.join(packagesDir, 'index.md'), renderPackageIndex(packages))
writeFileSync(path.join(releasesDir, 'index.md'), renderReleases(releases))
writeFileSync(path.join(siteDir, 'api-entry.json'), `${JSON.stringify({ entryPoints: projects.map(project => `../${project}`) }, null, '\t')}\n`)

console.log(`Prepared ${packages.length} packages and ${releases.length} releases`)
```

- [ ] **Step 2: Run it and inspect the output**

```bash
node site/scripts/prepare.ts
ls site/packages site/packages/cmcd site/packages/cmcd/guides
head -5 site/releases/index.md
grep -c '"folder"' site/packages/packages.json
grep guides site/packages/iso-bmff/index.md
cat site/api-entry.json
```

Expected: 20 package folders plus `index.md` and `packages.json`. `cmcd/guides` has three files. The releases table starts with the newest date. `packages.json` has 20 folders. The iso-bmff README links read `guides/reading-boxes.md`. `api-entry.json` lists 20 entries such as `../libs/cmcd`.

- [ ] **Step 3: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/scripts/prepare.ts
git commit -s -m "feat(site): generate package pages, the releases feed, and the TypeDoc entry list"
```

---

### Task 6: TypeDoc markdown output

**Files:**
- Create: `site/scripts/typedocModuleNames.ts`, `site/typedoc.json`

**Interfaces:**
- Consumes: `site/api-entry.json` from Task 5.
- Produces: `site/api/index.md`, `site/api/<pkg>/**/*.md`, `site/api/typedoc-sidebar.json`.

- [ ] **Step 1: Create the module rename plugin**

```ts
import { Application, ReflectionKind, type ProjectReflection } from 'typedoc'

const scope = '@svta/cml-'

// The packages strategy names each module after its package, so TypeDoc would write
// api/@svta/cml-cmcd/. The site uses the folder name: api/cmcd/.
// EVENT_VALIDATE_PROJECT fires after link resolution and before URLs are built.
// EVENT_PROJECT_REVIVE is too early: cross-package links such as
// `@svta/cml-utils!HttpRequest` would no longer resolve.
export function load(app: Application): void {
	app.on(Application.EVENT_VALIDATE_PROJECT, (project: ProjectReflection) => {
		for (const module of project.getReflectionsByKind(ReflectionKind.Module)) {
			if (module.name.startsWith(scope)) {
				module.name = module.name.slice(scope.length)
			}
		}
	})
}
```

- [ ] **Step 2: Create typedoc.json**

Copy the `externalSymbolLinkMappings` object verbatim from the deleted `docs/typedoc.json` with `git show c77c91174:docs/typedoc.json`. Everything else is new:

```json
{
	"$schema": "https://typedoc.org/schema.json",
	"extends": ["./api-entry.json"],
	"plugin": [
		"typedoc-plugin-markdown",
		"typedoc-vitepress-theme",
		"./scripts/typedocModuleNames.ts"
	],
	"name": "CML",
	"entryPointStrategy": "packages",
	"packageOptions": {
		"entryPoints": ["src/index.ts"],
		"tsconfig": "../../tsconfig.typedoc.json",
		"jsDocCompatibility": false,
		"readme": "none"
	},
	"readme": "none",
	"out": "./api",
	"docsRoot": "./",
	"cleanOutputDir": true,
	"excludeInternal": true,
	"excludePrivate": true,
	"hideGenerator": true,
	"jsDocCompatibility": false,
	"hideBreadcrumbs": true,
	"useCodeBlocks": true,
	"sidebar": {
		"collapsed": true,
		"pretty": false
	},
	"externalSymbolLinkMappings": {}
}
```

- [ ] **Step 3: Run TypeDoc and time it**

```bash
cd site && time npx typedoc; cd ..
ls site/api | head
node -e 'const s=require("./site/api/typedoc-sidebar.json");console.log(s.length, s.map(i=>i.link).join(" "))'
find site/api -name "*.md" | wc -l
```

Expected: no errors. Warnings about unresolved links are allowed, but note them. 20 package folders plus `index.md` and `typedoc-sidebar.json`. The sidebar has 20 items with links such as `/api/cmcd/`. About 1,100 markdown files. Record the time in `phases.md` under Risks.

- [ ] **Step 4: Compare warnings with the baseline**

The old build had 19 warnings, 18 of them about missing `docs/*.md` globs. Expected now: at most the one remaining warning from the old build. Any new "Failed to resolve link" warning means the rename ran too early. Check that the plugin uses `EVENT_VALIDATE_PROJECT`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/typedoc.json site/scripts/typedocModuleNames.ts
git commit -s -m "feat(site): render the API reference as markdown with per-package folders"
```

---

### Task 7: VitePress configuration, landing page, and guide

**Files:**
- Create: `site/scripts/searchExcerpt.ts`, `site/scripts/searchExcerpt.test.ts`, `site/.vitepress/config.ts`, `site/index.md`, `site/guide/getting-started.md`

**Interfaces:**
- Consumes: `site/packages/packages.json` (`PackageInfo[]`), `site/api/typedoc-sidebar.json`, `groupOrder` and `PackageInfo` types.
- Produces: `searchExcerpt(markdown: string): string`, `site/dist/` after `vitepress build`.

- [ ] **Step 1: Write the failing search excerpt tests**

```ts
import { equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { searchExcerpt } from './searchExcerpt.ts'

const page = `# Function: encodeCmcd()

\`\`\`ts
function encodeCmcd(cmcd, options?): string;
\`\`\`

Defined in: [encodeCmcd.ts:21](https://example.com)

Encode a CMCD object to a string.

## Parameters

### cmcd

The CMCD object to encode.
`

describe('searchExcerpt', () => {
	it('keeps the title and the first paragraph of prose', () => {
		equal(searchExcerpt(page), '# Function: encodeCmcd()\n\nEncode a CMCD object to a string.\n')
	})

	it('keeps only the title when there is no prose', () => {
		equal(searchExcerpt('# Type Alias: Cmcd\n\n```ts\ntype Cmcd = object;\n```\n'), '# Type Alias: Cmcd\n')
	})

	it('returns the input when there is no title', () => {
		equal(searchExcerpt('Just text\n'), 'Just text\n')
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test site/scripts/searchExcerpt.test.ts`
Expected: FAIL, cannot find module `./searchExcerpt.ts`.

- [ ] **Step 3: Implement searchExcerpt.ts**

```ts
// The search index keeps the title and the first paragraph of an API page.
// Full API pages would make the index several megabytes.
export function searchExcerpt(markdown: string): string {
	const withoutCode = markdown.replace(/```[\s\S]*?```/g, '')
	const lines = withoutCode.split('\n')
	const titleIndex = lines.findIndex(line => line.startsWith('# '))

	if (titleIndex < 0) {
		return markdown
	}

	const title = lines[titleIndex]
	const paragraph = lines
		.slice(titleIndex + 1)
		.join('\n')
		.split(/\n\s*\n/)
		.map(part => part.trim())
		.find(part => part !== '' && !part.startsWith('#') && !part.startsWith('Defined in:') && !part.startsWith('|'))

	return paragraph ? `${title}\n\n${paragraph}\n` : `${title}\n`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test site/scripts/searchExcerpt.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Create the VitePress config**

`site/.vitepress/config.ts`:

```ts
import { readFileSync } from 'node:fs'
import { defineConfig, type DefaultTheme } from 'vitepress'
import type { PackageInfo } from '../scripts/packages.ts'
import { searchExcerpt } from '../scripts/searchExcerpt.ts'

const base = process.env['SITE_BASE'] ?? '/'
const repo = 'https://github.com/streaming-video-technology-alliance/common-media-library'

// Generated by `node scripts/prepare.ts` and `typedoc`. Read at config time, not imported,
// so `tsc` does not need the generated files.
const packages: PackageInfo[] = JSON.parse(readFileSync(new URL('../packages/packages.json', import.meta.url), 'utf8'))
const apiSidebar: DefaultTheme.SidebarItem[] = JSON.parse(readFileSync(new URL('../api/typedoc-sidebar.json', import.meta.url), 'utf8'))

function packageSidebar(pkg: PackageInfo): DefaultTheme.SidebarItem[] {
	const api = apiSidebar.find(item => item.link === `/api/${pkg.folder}/`)
	const items: DefaultTheme.SidebarItem[] = [
		{ text: 'Overview', link: `/packages/${pkg.folder}/` },
	]

	if (pkg.guides.length > 0) {
		items.push({
			text: 'Guides',
			items: pkg.guides.map(guide => ({ text: guide.title, link: `/packages/${pkg.folder}/guides/${guide.slug}` })),
		})
	}

	items.push(
		{ text: 'API', link: `/api/${pkg.folder}/`, collapsed: true, items: api?.items ?? [] },
		{ text: 'Changelog', link: `/packages/${pkg.folder}/changelog` },
	)

	return [{ text: pkg.name, items }]
}

const sidebar: DefaultTheme.SidebarMulti = {
	'/guide/': [
		{ text: 'Guide', items: [{ text: 'Getting started', link: '/guide/getting-started' }] },
	],
	'/packages/': [
		{ text: 'Packages', items: packages.map(pkg => ({ text: pkg.name, link: `/packages/${pkg.folder}/` })) },
	],
	'/api/': [
		{ text: 'API reference', items: packages.map(pkg => ({ text: pkg.name, link: `/api/${pkg.folder}/` })) },
	],
	'/releases/': [
		{ text: 'Releases', items: [{ text: 'All releases', link: '/releases/' }] },
	],
}

// VitePress picks the longest matching key, so package paths win over the section paths.
for (const pkg of packages) {
	sidebar[`/packages/${pkg.folder}/`] = packageSidebar(pkg)
	sidebar[`/api/${pkg.folder}/`] = packageSidebar(pkg)
}

export default defineConfig({
	title: 'Common Media Library',
	description: 'TypeScript libraries for web video players, maintained by the Streaming Video Technology Alliance.',
	base,
	cleanUrls: true,
	outDir: 'dist',
	srcExclude: ['**/node_modules/**'],
	head: [
		['link', { rel: 'icon', type: 'image/png', href: `${base}favicon.png` }],
	],
	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/getting-started' },
			{ text: 'Packages', link: '/packages/' },
			{ text: 'Releases', link: '/releases/' },
		],
		sidebar,
		socialLinks: [
			{ icon: 'github', link: repo },
			{ icon: 'discord', link: 'https://discord.gg/g2c5vwGvUc' },
		],
		footer: {
			message: 'A Streaming Video Technology Alliance project.',
			copyright: 'Released under the Apache-2.0 license.',
		},
		search: {
			provider: 'local',
			options: {
				_render(src, env, md) {
					if (env.relativePath.startsWith('api/')) {
						return md.render(searchExcerpt(src))
					}

					return md.render(src, env)
				},
			},
		},
	},
})
```

If `tsc` reports that `_render` parameters have implicit `any`, annotate them with the types from `vitepress`: `(src: string, env: MarkdownEnv, md: MarkdownRenderer)` and add `type MarkdownEnv, type MarkdownRenderer` to the `vitepress` import.

- [ ] **Step 6: Create the landing page**

`site/index.md`:

```md
---
layout: home

hero:
  name: Common Media Library
  text: Shared libraries for web video players
  tagline: TypeScript implementations of CMCD, CMSD, ISO BMFF, captions, DRM, C2PA, and more. Maintained by the Streaming Video Technology Alliance.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Browse packages
      link: /packages/
    - theme: alt
      text: GitHub
      link: https://github.com/streaming-video-technology-alliance/common-media-library

features:
  - title: Spec-accurate
    details: Each package implements one specification. No invented extensions.
  - title: Tree-shakeable
    details: Import one function and ship only that function.
  - title: Typed
    details: Union and literal types guide autocomplete. Incorrect usage fails at compile time.
  - title: Peer dependencies stay inside CML
    details: No framework, no runtime, no polyfills.
---
```

- [ ] **Step 7: Create the getting started guide**

`site/guide/getting-started.md`. The code example is the one from the root `README.md`, unchanged:

````md
# Getting started

Each package installs on its own. Install the one you need:

```bash
npm i @svta/cml-cmcd
```

Import the functions you use. Your bundler drops the rest.

```typescript
import { appendCmcdQuery, CmcdObjectType } from "@svta/cml-cmcd";

const cmcd = {
	sid: "4f2867f2-b0fd-4db7-a3e0-cea7dff44cfb",
	cid: "cc002fc3-d9e1-418d-9a5f-3d0eac601882",
	d: 4004.37,
	ot: CmcdObjectType.VIDEO,
	["com.example-hello"]: "world",
};

const cmcdUrl = appendCmcdQuery("https://example.com/video/segment-1.m4s", cmcd);
console.log(cmcdUrl);
// https://example.com/video/segment-1.m4s?CMCD=cid%3D%22cc002fc3-d9e1-418d-9a5f-3d0eac601882%22%2Ccom.example-hello%3D%22world%22%2Cd%3D4004%2Cot%3Dv%2Csid%3D%224f2867f2-b0fd-4db7-a3e0-cea7dff44cfb%22%2Cv%3D2
```

## Peer dependencies

Some packages depend on other CML packages and declare them as peer dependencies. npm 7 and later installs peer dependencies for you. The package overview lists them.

## Next steps

- [Browse the packages](/packages/). Each package page has an overview, guides, the API reference, and the changelog.
- [Follow the releases](/releases/).
- Ask questions on [Discord](https://discord.gg/g2c5vwGvUc) or in [GitHub Discussions](https://github.com/streaming-video-technology-alliance/common-media-library/discussions).
````

The outer fence has four backticks so the inner fences render. Write the file without the outer fence.

- [ ] **Step 8: Build the site**

```bash
cd site && node scripts/prepare.ts && npx typedoc && time npx vitepress build; cd ..
```

Expected: `build complete`. If the build reports dead links, the output names the file and the link. Fix the source in `libs/` when a README or guide is wrong, or `prepare.ts` when a rewrite rule is missing. Do not add `ignoreDeadLinks`. Record the build time in `phases.md` under Risks.

- [ ] **Step 9: Open the dev server and check five pages**

```bash
npm run docs
```

Check in the browser: `/`, `/packages/`, `/packages/cmcd/`, `/packages/cmcd/guides/user-guide`, `/api/cmcd/functions/encodeCmcd`. The package pages show the package sidebar with Overview, Guides, API, Changelog. The API page shows the same sidebar. Search for `encodeCmcd` finds the function page. Stop the server.

- [ ] **Step 10: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/.vitepress/config.ts site/index.md site/guide site/scripts/searchExcerpt.ts site/scripts/searchExcerpt.test.ts
git commit -s -m "feat(site): add the VitePress config, landing page, and getting started guide"
```

---

### Task 8: Redirect stubs for the old URLs

**Files:**
- Create: `site/scripts/redirects.ts`, `site/scripts/redirects.test.ts`, `site/scripts/writeRedirects.ts`

**Interfaces:**
- Consumes: `PackageInfo` from Task 4, `site/packages/packages.json`, the `site/api` tree, `site/dist`.
- Produces: `type Redirect = { from: string; to: string }`, `oldPrefix(packageName: string): string`, `documentName(title: string): string`, `redirectsFor(packages: PackageInfo[], apiFiles: string[]): Redirect[]`, `redirectHtml(to: string, base: string): string`.

- [ ] **Step 1: Write the failing tests**

```ts
import { deepEqual, equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PackageInfo } from './packages.ts'
import { documentName, oldPrefix, redirectHtml, redirectsFor } from './redirects.ts'

const cmcd: PackageInfo = {
	folder: 'cmcd',
	name: '@svta/cml-cmcd',
	version: '2.8.3',
	description: 'CMCD',
	group: 'Delivery',
	guides: [{ slug: 'user-guide', title: 'User Guide' }],
}

describe('oldPrefix', () => {
	it('replaces @ and / with underscores', () => {
		equal(oldPrefix('@svta/cml-cmcd'), '_svta_cml-cmcd')
	})
})

describe('documentName', () => {
	it('replaces spaces and slashes with underscores', () => {
		equal(documentName('VSI/EMSG Validation'), 'VSI_EMSG_Validation')
	})
})

describe('redirectsFor', () => {
	it('maps the root pages, the module page, the guides, and the symbols', () => {
		const files = ['index.md', 'cmcd/index.md', 'cmcd/enumerations/CmcdObjectType.md', 'cmcd/type-aliases/Cmcd.md', 'cmcd/functions/encodeCmcd.md']
		deepEqual(redirectsFor([cmcd], files), [
			{ from: 'modules.html', to: '/packages/' },
			{ from: 'hierarchy.html', to: '/api/' },
			{ from: 'modules/_svta_cml-cmcd.html', to: '/api/cmcd/' },
			{ from: 'documents/_svta_cml-cmcd.User_Guide.html', to: '/packages/cmcd/guides/user-guide' },
			{ from: 'enums/_svta_cml-cmcd.CmcdObjectType.html', to: '/api/cmcd/enumerations/CmcdObjectType' },
			{ from: 'types/_svta_cml-cmcd.Cmcd.html', to: '/api/cmcd/type-aliases/Cmcd' },
			{ from: 'functions/_svta_cml-cmcd.encodeCmcd.html', to: '/api/cmcd/functions/encodeCmcd' },
		])
	})

	it('ignores files of packages that are not published', () => {
		deepEqual(redirectsFor([cmcd], ['mse/functions/x.md']).some(r => r.from.includes('mse')), false)
	})
})

describe('redirectHtml', () => {
	it('joins the base path and the target', () => {
		const html = redirectHtml('/api/cmcd/', '/common-media-library/')
		equal(html.includes('content="0; url=/common-media-library/api/cmcd/"'), true)
		equal(html.includes('<link rel="canonical" href="/common-media-library/api/cmcd/">'), true)
		equal(html.includes('<meta name="robots" content="noindex">'), true)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test site/scripts/redirects.test.ts`
Expected: FAIL, cannot find module `./redirects.ts`.

- [ ] **Step 3: Implement redirects.ts**

```ts
import type { PackageInfo } from './packages.ts'

export type Redirect = {
	from: string;
	to: string;
}

// Markdown folder name to the folder name of the old HTML site.
const kindDirs: Record<string, string> = {
	'classes': 'classes',
	'enumerations': 'enums',
	'functions': 'functions',
	'interfaces': 'interfaces',
	'type-aliases': 'types',
	'variables': 'variables',
}

// `@svta/cml-cmcd` was `_svta_cml-cmcd` in every old file name.
export function oldPrefix(packageName: string): string {
	return packageName.replace(/[@/]/g, '_')
}

// The old site named a guide page after its frontmatter title, with `_` for spaces and slashes.
export function documentName(title: string): string {
	return title.replace(/[\s/]/g, '_')
}

// `apiFiles` are paths relative to `site/api`, such as `cmcd/functions/encodeCmcd.md`.
export function redirectsFor(packages: PackageInfo[], apiFiles: string[]): Redirect[] {
	const redirects: Redirect[] = [
		{ from: 'modules.html', to: '/packages/' },
		{ from: 'hierarchy.html', to: '/api/' },
	]
	const byFolder = new Map(packages.map(pkg => [pkg.folder, pkg]))

	for (const pkg of packages) {
		const prefix = oldPrefix(pkg.name)
		redirects.push({ from: `modules/${prefix}.html`, to: `/api/${pkg.folder}/` })

		for (const guide of pkg.guides) {
			redirects.push({ from: `documents/${prefix}.${documentName(guide.title)}.html`, to: `/packages/${pkg.folder}/guides/${guide.slug}` })
		}
	}

	for (const file of apiFiles) {
		const [folder, kindDir, name] = file.split('/')
		const pkg = folder ? byFolder.get(folder) : undefined
		const oldDir = kindDir ? kindDirs[kindDir] : undefined

		if (!pkg || !oldDir || !name?.endsWith('.md')) {
			continue
		}

		const symbol = name.slice(0, -'.md'.length)
		redirects.push({ from: `${oldDir}/${oldPrefix(pkg.name)}.${symbol}.html`, to: `/api/${pkg.folder}/${kindDir}/${symbol}` })
	}

	return redirects
}

// `base` starts and ends with `/`. `to` starts with `/`.
export function redirectHtml(to: string, base: string): string {
	const url = `${base}${to.slice(1)}`

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting</title>
<meta http-equiv="refresh" content="0; url=${url}">
<link rel="canonical" href="${url}">
<meta name="robots" content="noindex">
</head>
<body>
<p>This page moved to <a href="${url}">${url}</a>.</p>
</body>
</html>
`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test site/scripts/redirects.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Implement the runner**

`site/scripts/writeRedirects.ts`:

```ts
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { PackageInfo } from './packages.ts'
import { redirectHtml, redirectsFor } from './redirects.ts'

const siteDir = path.resolve(import.meta.dirname, '..')
const apiDir = path.join(siteDir, 'api')
const distDir = path.join(siteDir, 'dist')
const base = process.env['SITE_BASE'] ?? '/'

if (!existsSync(distDir)) {
	throw new Error(`${distDir} does not exist. Run "vitepress build" first.`)
}

const packages: PackageInfo[] = JSON.parse(readFileSync(path.join(siteDir, 'packages', 'packages.json'), 'utf8'))
const apiFiles = readdirSync(apiDir, { recursive: true })
	.map(file => String(file).split(path.sep).join('/'))
	.filter(file => file.endsWith('.md'))

const redirects = redirectsFor(packages, apiFiles)

for (const redirect of redirects) {
	const target = path.join(distDir, redirect.from)

	if (existsSync(target)) {
		throw new Error(`Redirect stub ${redirect.from} would overwrite a page of the new site.`)
	}

	mkdirSync(path.dirname(target), { recursive: true })
	writeFileSync(target, redirectHtml(redirect.to, base))
}

console.log(`Wrote ${redirects.length} redirect stubs`)
```

- [ ] **Step 6: Run it against the build from Task 7**

```bash
node site/scripts/writeRedirects.ts
ls site/dist/enums | head -3
cat site/dist/modules/_svta_cml-cmcd.html
```

Expected: about 1,050 stubs. The module stub refreshes to `/api/cmcd/`.

- [ ] **Step 7: Lint, typecheck, commit**

```bash
npm run lint && npm run typecheck
git add site/scripts/redirects.ts site/scripts/redirects.test.ts site/scripts/writeRedirects.ts
git commit -s -m "feat(site): write redirect stubs for the old TypeDoc URLs"
```

---

### Task 9: Smoke check and the full build

**Files:**
- Create: `site/scripts/check.ts`
- Modify: `plans/consolidated-site/phases.md` (measured times)

**Interfaces:**
- Consumes: `site/dist`.

- [ ] **Step 1: Implement check.ts**

```ts
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(import.meta.dirname, '..', 'dist')
const limit = 2 * 1024 * 1024

const required = [
	'index.html',
	'404.html',
	'guide/getting-started.html',
	'packages/index.html',
	'packages/cmcd/index.html',
	'packages/cmcd/guides/user-guide.html',
	'packages/cmcd/changelog.html',
	'api/index.html',
	'api/cmcd/index.html',
	'api/cmcd/functions/encodeCmcd.html',
	'releases/index.html',
	'modules.html',
	'modules/_svta_cml-cmcd.html',
	'enums/_svta_cml-cmcd.CmcdObjectType.html',
	'documents/_svta_cml-cmcd.User_Guide.html',
]

const missing = required.filter(file => !existsSync(path.join(distDir, file)))

if (missing.length > 0) {
	console.error(`site/dist is missing:\n- ${missing.join('\n- ')}`)
	process.exit(1)
}

const chunksDir = path.join(distDir, 'assets', 'chunks')
const index = readdirSync(chunksDir).find(file => file.startsWith('@localSearchIndexroot'))

if (!index) {
	console.error('site/dist has no local search index chunk')
	process.exit(1)
}

const bytes = statSync(path.join(chunksDir, index)).size

if (bytes > limit) {
	console.error(`The search index is ${bytes} bytes. The limit is ${limit} bytes. Trim searchExcerpt or exclude pages.`)
	process.exit(1)
}

console.log(`site/dist OK. Search index ${Math.round(bytes / 1024)} KB.`)
```

- [ ] **Step 2: Run the full build chain and time it**

```bash
time npm run build -w site
```

Expected: every step passes and the last line is `site/dist OK`. Record the total time, the TypeDoc time, the VitePress time, and the index size in `phases.md` under Risks, replacing the extrapolation sentence.

- [ ] **Step 3: Prove the build does not need the package builds**

```bash
npm run clean && npm run build -w site && npm run build
```

Expected: the site build passes with no `libs/*/dist` present. The final `npm run build` restores the package builds. If the site build fails without `dist`, add `npm run build` before the site build in `site.pr.yml` in Task 10 and note the reason in `architecture.md`.

- [ ] **Step 4: Run the site tests and the root checks**

```bash
npm test -w site && npm run lint && npm run typecheck
```

Expected: all site tests pass.

- [ ] **Step 5: Commit**

```bash
git add site/scripts/check.ts plans/consolidated-site/phases.md
git commit -s -m "feat(site): add the build smoke check"
```

---

### Task 10: Workflows

**Files:**
- Modify: `.github/workflows/docs.yml:33,38`, `.github/workflows/publish.yml:40,45`, `.github/workflows/publish-package.yml:44,49`
- Create: `.github/workflows/site.pr.yml`

- [ ] **Step 1: Point the three deploy workflows at the site**

In each of the three files, the "Build Docs" step becomes:

```yaml
      - name: Build Site
        run: npm run build -w site
        env:
          SITE_BASE: /common-media-library/
```

and the deploy step's `publish_dir` becomes `./site/dist/`. Rename the deploy step to `Deploy Site`.

- [ ] **Step 2: Create the pull request check**

`.github/workflows/site.pr.yml`:

```yaml
name: Site

on:
  pull_request:
    paths:
      - "site/**"
      - "libs/*/README.md"
      - "libs/*/docs/**"
      - "libs/*/CHANGELOG.md"
      - "scripts/projects.ts"
      - ".github/workflows/site.pr.yml"

permissions:
  contents: read

jobs:
  site:
    concurrency:
      group: site-${{ github.ref }}
      cancel-in-progress: true

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: "npm"

      - name: Install
        run: npm ci

      - name: Build Site
        run: npm run build -w site
        env:
          SITE_BASE: /common-media-library/
```

- [ ] **Step 3: Validate the YAML**

```bash
node -e 'for (const f of ["docs","publish","publish-package","site.pr"]) { const t=require("fs").readFileSync(`.github/workflows/${f}.yml`,"utf8"); if(!t.includes("site/dist") && f!=="site.pr") throw new Error(f); console.log(f, "ok") }'
```

Expected: four `ok` lines.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows
git commit -s -m "ci: build and deploy the site workspace"
```

---

### Task 11: Repository docs

**Files:**
- Modify: `README.md:9`, `AGENTS.md:23-29` (Build Commands) and the Documentation section, root `CHANGELOG.md` Unreleased section

- [ ] **Step 1: Update the README project structure paragraph**

Replace the sentence that names the workspaces with:

```md
This project is a monorepo with three workspaces: `libs`, `site`, and `dev`. The `libs` workspace contains the individual libraries, which are published to npm. The `site` workspace contains the website: the landing page, the package guides, and the API reference. The site is published on GitHub Pages. The `dev` workspace is a private development server. The available libraries are:
```

- [ ] **Step 2: Update AGENTS.md**

Add to Build Commands, after the `npm run format` line:

```md
- `npm run docs`: Start the website dev server. `npm run build -w site` builds the website into `site/dist`. The build fails on dead links in any README or guide.
```

Add to the Documentation section:

```md
- The website copies every published package's `README.md`, `docs/*.md`, and `CHANGELOG.md` at build time. Link to a guide from a README as `docs/<file>.md`. Link between guides as sibling files, for example `other-guide.md#anchor`.
- Every package needs an entry in `site/scripts/groups.ts`. The site build fails without one.
```

- [ ] **Step 3: Add the root changelog entry**

Under `## [Unreleased]` in the root `CHANGELOG.md`:

```md
### Changed

- The documentation site is now a VitePress site in the `site` workspace. It serves the landing page, package guides, API reference, and releases feed. Old TypeDoc URLs redirect to the new pages.
```

- [ ] **Step 4: Run the prose gate**

Every edited sentence is under 20 words, with no semicolons or em dashes. Check with:

```bash
grep -nE "—|;" README.md AGENTS.md CHANGELOG.md | grep -v '`' || echo clean
```

- [ ] **Step 5: Commit**

```bash
git add README.md AGENTS.md CHANGELOG.md
git commit -s -m "docs: describe the site workspace"
```

---

### Task 12: Final verification before the pull request

- [ ] **Step 1: Full root validation**

```bash
npm test
```

Expected: lint, build, typecheck, and every package test pass. The `site` workspace tests run through `--workspaces`.

- [ ] **Step 2: Full site build with the production base path**

```bash
SITE_BASE=/common-media-library/ npm run build -w site
SITE_BASE=/common-media-library/ npx vitepress preview site --port 3627
```

Open `http://localhost:3627/common-media-library/` and `http://localhost:3627/common-media-library/enums/_svta_cml-cmcd.CmcdObjectType.html`. The second URL lands on the enumeration page. `vitepress preview` serves clean URLs the same way GitHub Pages does. Stop the server.

- [ ] **Step 3: Rebase on main and check PR 557**

```bash
git fetch origin && git rebase origin/main
gh pr view 557 --json state --jq .state
```

If PR 557 is merged: `scripts/agentDocs.ts` exists. Make four changes. Insert `(cd .. && node scripts/agentDocs.ts --site site/dist) && ` before `node scripts/check.ts` in the `build` script of `site/package.json`. Add `'llms.txt'` to `required` in `check.ts`. Add `{ text: 'LLMs', link: '/llms.txt', target: '_self' }` to `nav` in the VitePress config. Remove any `docs/` references that the rebase brought back. Rebuild and commit with `feat(site): publish llms.txt from the site build`.

If PR 557 is open: leave the build chain as is. Write in the pull request description that PR 557 must update its output path to `site/dist` after this merges.

- [ ] **Step 4: Remove the plan files**

The plan folder never reaches `main`. Before creating the pull request:

```bash
git rm -r plans/consolidated-site
git commit -s -m "chore: remove the consolidated site plan files"
```

Record the decisions that adopters need in `AGENTS.md`, done in Task 11. Open GitHub issues for phase 3 (design pass) and phase 4 (domain cutover) with the content of `phases.md`.

- [ ] **Step 5: Hand off**

Casey creates the pull request with `/create-pr main`. The description lists the URL map, the three workflow changes, the redirect approach, and the PR 557 dependency.
