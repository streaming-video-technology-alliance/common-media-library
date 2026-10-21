# Agent-facing docs and skill: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give coding agents one text per CML package that says when to use it, and derive an installable skill and `llms.txt` from that text.

**Architecture:** Each published package README gets a `## When to use` section. `scripts/agentDocs.ts` parses the sections, checks every named export against the package API report, and renders two outputs: committed skill files under `skills/common-media-library/` and `llms.txt` plus markdown copies in the docs site. A root test validates the sections. A CI step fails on stale skill files.

**Tech Stack:** Node 24 (runs `.ts` directly), `node:test`, `node:fs`, `node:path`, `node:util` `parseArgs`. No new dependency.

Design record: [design.md](design.md).

## Global constraints

- Node >= 24. Scripts are TypeScript files that `node` runs directly. No build step for scripts.
- No new dependency in any `package.json`.
- Code style from `eslint.config.ts`: tabs, single quotes, no semicolons, `type` aliases and not `interface`.
- Every commit: `git commit -s`, Conventional Commits prefix, and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Prose rules from AGENTS.md Writing Style apply to README sections, SKILL.md, changelog entries, and AGENTS.md edits: sentences under 20 words, no semicolons, no em dashes, no "e.g.", active voice, imperative instructions with the condition first.
- Changelog entries: present tense, one change per entry, at most three sentences.
- Site base URL: `https://streaming-video-technology-alliance.github.io/common-media-library/`
- Source base URL: `https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/`
- Published packages come from `projects` in `scripts/projects.ts`. `libs/mse` is unpublished and gets no section.
- Run every command from the repository root unless a step says otherwise.
- The branch is `claude/agents-duplicating-cml-features-c9de36`. Never commit to `main`.

## File structure

| Path | Responsibility |
| - | - |
| `scripts/agentDocs.ts` | Parse When to use sections, read exports, rewrite links, load package docs, render and write the skill and the site files, CLI entry |
| `scripts/agentDocs.test.ts` | Unit tests with inline fixtures, plus the integration test over every published package |
| `scripts/buildAll.ts` | Calls `writeSkill()` after the last package build |
| `skills/common-media-library/SKILL.md` | Hand-written rules and frontmatter, generated package index between markers |
| `skills/common-media-library/references/<slug>.md` | Generated: README, guides, and API report of one package |
| `docs/package.json` | Build script runs the site mode after TypeDoc |
| `libs/<pkg>/README.md` | New `## When to use` section, 20 packages |
| `libs/<pkg>/CHANGELOG.md` | One entry under Unreleased, 20 packages |
| `.github/workflows/ci.pr.yml` | `git diff --exit-code -- skills` step |
| `AGENTS.md`, `README.md` | Dependency-bug rule, section rule, Coding agents section |

---

### Task 1: Section parser and export check

**Files:**
- Create: `scripts/agentDocs.ts`
- Create: `scripts/agentDocs.test.ts`
- Modify: `plans/agent-docs/design.md`

**Interfaces:**
- Produces: `parseWhenToUse(readme: string, file: string): WhenToUse`, `readExports(apiReport: string): Set<string>`, `checkExports(section: WhenToUse, exports: Set<string>, file: string): void`, types `Bullet` and `WhenToUse`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/agentDocs.test.ts`:

```ts
import { deepEqual, equal, throws } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkExports, parseWhenToUse, readExports } from './agentDocs.ts'

const readme = `# @svta/cml-example

Example package.

## When to use

- Parse boxes from a segment: \`readBoxes\`, \`findBox\`
- Write \`emsg\` boxes: \`writeEmsg\`

Do not write your own box parser.

## Installation
`

const file = 'libs/example/README.md'

describe('parseWhenToUse', () => {
	it('returns one bullet per task with its exports', () => {
		const section = parseWhenToUse(readme, file)
		deepEqual(section.bullets.map(b => b.task), ['Parse boxes from a segment', 'Write `emsg` boxes'])
		deepEqual(section.bullets.map(b => b.exports), [['readBoxes', 'findBox'], ['writeEmsg']])
		equal(section.closing, 'Do not write your own box parser.')
	})

	it('keeps the section body verbatim without the heading', () => {
		const section = parseWhenToUse(readme, file)
		equal(section.text, '- Parse boxes from a segment: `readBoxes`, `findBox`\n- Write `emsg` boxes: `writeEmsg`\n\nDo not write your own box parser.')
	})

	it('stops at the next heading', () => {
		const section = parseWhenToUse(`${readme}\n- Not a task: \`nope\`\n`, file)
		equal(section.bullets.length, 2)
	})

	it('throws when the heading is missing', () => {
		throws(() => parseWhenToUse('# x\n\n## Installation\n', file), /libs\/example\/README\.md: the heading is missing/)
	})

	it('throws when a bullet has no colon', () => {
		throws(() => parseWhenToUse('## When to use\n\n- Parse boxes `readBoxes`\n- Two: `a`\n\nClosing.\n', file), /the bullet "Parse boxes `readBoxes`" has no colon/)
	})

	it('throws when a bullet names no export after the colon', () => {
		throws(() => parseWhenToUse('## When to use\n\n- Parse boxes: nothing\n- Two: `a`\n\nClosing.\n', file), /names no export after the colon/)
	})

	it('throws when text other than an export list follows the colon', () => {
		throws(() => parseWhenToUse('## When to use\n\n- Parse boxes: `a` and `b`\n- Two: `a`\n\nClosing.\n', file), /text after the colon that is not an export list/)
	})

	it('throws when the closing paragraph is missing', () => {
		throws(() => parseWhenToUse('## When to use\n\n- One: `a`\n- Two: `b`\n\n## Installation\n', file), /the closing paragraph is missing/)
	})

	it('throws when there are too few or too many bullets', () => {
		throws(() => parseWhenToUse('## When to use\n\n- One: `a`\n\nClosing.\n', file), /the section has 1 bullets/)
		const many = Array.from({ length: 9 }, (_, i) => `- Task ${i}: \`a\``).join('\n')
		throws(() => parseWhenToUse(`## When to use\n\n${many}\n\nClosing.\n`, file), /the section has 9 bullets/)
	})

	it('throws when text comes before the first bullet', () => {
		throws(() => parseWhenToUse('## When to use\n\nIntro.\n\n- One: `a`\n- Two: `b`\n\nClosing.\n', file), /comes before the first bullet/)
	})
})

describe('readExports', () => {
	it('collects function, const, class, and type names', () => {
		const report = '```ts\n\nexport function readBoxes(): void;\n\nexport const DATA = 1;\n\nexport class Box {}\n\nexport type Emsg = {};\n\n// @public\nexport function readBoxes(a: number): void;\n```'
		deepEqual([...readExports(report)].sort(), ['Box', 'DATA', 'Emsg', 'readBoxes'])
	})
})

describe('checkExports', () => {
	it('throws for an identifier that is not an export and names the bullet', () => {
		const section = parseWhenToUse(readme, file)
		throws(
			() => checkExports(section, new Set(['readBoxes', 'writeEmsg']), file),
			/libs\/example\/README\.md: "findBox" in the bullet "Parse boxes from a segment: `readBoxes`, `findBox`" is not an export/,
		)
	})

	it('accepts a section whose identifiers are all exports', () => {
		const section = parseWhenToUse(readme, file)
		checkExports(section, new Set(['readBoxes', 'findBox', 'writeEmsg']), file)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: FAIL, the import of `./agentDocs.ts` cannot be resolved.

- [ ] **Step 3: Write the parser**

Create `scripts/agentDocs.ts`:

```ts
export const siteBase = 'https://streaming-video-technology-alliance.github.io/common-media-library/'
export const sourceBase = 'https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/'
export const skillDir = 'skills/common-media-library'

const sectionHeading = '## When to use'
const minBullets = 2
const maxBullets = 8
const exportLine = /^export (?:function|const|class|type) ([A-Za-z_$][\w$]*)/gm
const identifier = /`([^`]+)`/g
const identifierShape = /^[A-Za-z_$][\w$]*$/

export type Bullet = {
	task: string;
	exports: string[];
	text: string;
};

export type WhenToUse = {
	bullets: Bullet[];
	closing: string;
	text: string;
};

function shape(file: string, problem: string): Error {
	return new Error(`${file}: ${problem}. Expected a "${sectionHeading}" heading, ${minBullets} to ${maxBullets} bullets of the form "- <task>: \`export\`, \`export\`", and a closing paragraph.`)
}

function parseBullet(text: string, file: string): Bullet {
	const colon = text.indexOf(':')

	if (colon === -1) {
		throw shape(file, `the bullet "${text}" has no colon`)
	}

	const task = text.slice(0, colon).trim()
	const rest = text.slice(colon + 1)
	const exports = Array.from(rest.matchAll(identifier), m => m[1])

	if (exports.length === 0) {
		throw shape(file, `the bullet "${text}" names no export after the colon`)
	}

	if (rest.replace(identifier, '').replace(/[,\s]/g, '') !== '') {
		throw shape(file, `the bullet "${text}" has text after the colon that is not an export list`)
	}

	for (const name of exports) {
		if (!identifierShape.test(name)) {
			throw shape(file, `"${name}" in the bullet "${text}" is not an identifier`)
		}
	}

	return { task, exports, text }
}

/**
 * Returns the `## When to use` section of a README.
 * Throws when the section is missing or does not have the expected shape.
 */
export function parseWhenToUse(readme: string, file: string): WhenToUse {
	const lines = readme.split('\n')
	const start = lines.indexOf(sectionHeading)

	if (start === -1) {
		throw shape(file, 'the heading is missing')
	}

	const next = lines.findIndex((line, i) => i > start && line.startsWith('## '))
	const body = lines.slice(start + 1, next === -1 ? lines.length : next)
	const bullets: Bullet[] = []
	const closing: string[] = []

	for (const line of body) {
		if (line.startsWith('- ')) {
			if (closing.length > 0) {
				throw shape(file, `the bullet "${line}" comes after the closing paragraph`)
			}
			bullets.push(parseBullet(line.slice(2), file))
		}
		else if (line.trim() !== '') {
			if (bullets.length === 0) {
				throw shape(file, `the line "${line}" comes before the first bullet`)
			}
			closing.push(line)
		}
	}

	if (bullets.length < minBullets || bullets.length > maxBullets) {
		throw shape(file, `the section has ${bullets.length} bullets`)
	}

	if (closing.length === 0) {
		throw shape(file, 'the closing paragraph is missing')
	}

	return { bullets, closing: closing.join('\n'), text: body.join('\n').trim() }
}

/** Returns the names of every function, const, class, and type that an API report exports. */
export function readExports(apiReport: string): Set<string> {
	return new Set(Array.from(apiReport.matchAll(exportLine), m => m[1]))
}

/** Throws when a bullet names an identifier that the package does not export. */
export function checkExports(section: WhenToUse, exports: Set<string>, file: string): void {
	for (const bullet of section.bullets) {
		for (const name of bullet.exports) {
			if (!exports.has(name)) {
				throw new Error(`${file}: "${name}" in the bullet "${bullet.text}" is not an export of the package. Check the API report under config/.`)
			}
		}
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Lint and typecheck**

Run: `npx eslint scripts/agentDocs.ts scripts/agentDocs.test.ts && npm run typecheck`
Expected: no output from eslint, tsc exits 0.

- [ ] **Step 6: Record the two spec changes**

In `plans/agent-docs/design.md`, make these two edits.

Replace `- Three to eight bullets. Each bullet is one task, written as the phrase a developer types to an agent.` with `- Two to eight bullets. Each bullet is one task, written as the phrase a developer types to an agent. Two packages, cta and request, have only two tasks.`

Replace `Each package gets an H3 heading with the package name, the description, the When to use bullets verbatim, and a line` with `Each package gets an H3 heading with the package name, the description, the When to use section body verbatim, and a line`.

Replace `- `llms-full.txt`: the site copies of every package, concatenated in the order of `projects.ts`. Near 300 KB.` with `- `llms-full.txt`: the site copies of every package, concatenated in alphabetical order of the package folder. Near 300 KB.`

- [ ] **Step 7: Commit**

```bash
git add scripts/agentDocs.ts scripts/agentDocs.test.ts plans/agent-docs/design.md && git commit -s -m "chore(scripts): parse the When to use README section" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Link rewriting and URL mapping

**Files:**
- Modify: `scripts/agentDocs.ts`
- Modify: `scripts/agentDocs.test.ts`

**Interfaces:**
- Produces: `rewriteLinks(markdown: string, sourcePath: string, toUrl: (repoPath: string) => string): string`, `sourceUrl(repoPath: string): string`, `siteUrl(copies: Map<string, string>): (repoPath: string) => string`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/agentDocs.test.ts`. Extend the import line to `import { checkExports, parseWhenToUse, readExports, rewriteLinks, siteBase, siteUrl, sourceBase, sourceUrl } from './agentDocs.ts'`.

```ts
describe('rewriteLinks', () => {
	const toUrl = (repoPath: string): string => `https://example.test/${repoPath}`

	it('resolves a README link to a guide against the package folder', () => {
		equal(rewriteLinks('[Reading](docs/reading-boxes.md)', 'libs/iso-bmff/README.md', toUrl), '[Reading](https://example.test/libs/iso-bmff/docs/reading-boxes.md)')
	})

	it('resolves a guide link to a sibling guide and keeps the anchor', () => {
		equal(rewriteLinks('[Keys](./user-guide.md#custom-keys)', 'libs/cmcd/docs/validation-guide.md', toUrl), '[Keys](https://example.test/libs/cmcd/docs/user-guide.md#custom-keys)')
	})

	it('resolves a link that leaves the package', () => {
		equal(rewriteLinks('[Root](../../README.md)', 'libs/cmcd/README.md', toUrl), '[Root](https://example.test/README.md)')
	})

	it('leaves absolute links, anchors, and root-relative links alone', () => {
		const text = '[a](https://x.y/z) [b](#top) [c](/abs.md) [d](mailto:x@y.z)'
		equal(rewriteLinks(text, 'libs/cmcd/README.md', toUrl), text)
	})

	it('rewrites every link in a document', () => {
		equal(rewriteLinks('[a](a.md) and [b](b.md)', 'libs/x/README.md', toUrl), '[a](https://example.test/libs/x/a.md) and [b](https://example.test/libs/x/b.md)')
	})
})

describe('sourceUrl', () => {
	it('prefixes the source base', () => {
		equal(sourceUrl('libs/cmcd/README.md'), `${sourceBase}libs/cmcd/README.md`)
	})
})

describe('siteUrl', () => {
	it('points a copied file at the site and any other file at the source', () => {
		const toUrl = siteUrl(new Map([['libs/iso-bmff/docs/reading-boxes.md', 'llms/iso-bmff/docs/reading-boxes.md']]))
		equal(toUrl('libs/iso-bmff/docs/reading-boxes.md'), `${siteBase}llms/iso-bmff/docs/reading-boxes.md`)
		equal(toUrl('libs/iso-bmff/src/index.ts'), `${sourceBase}libs/iso-bmff/src/index.ts`)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: FAIL, `rewriteLinks` is not exported.

- [ ] **Step 3: Write the functions**

Add to `scripts/agentDocs.ts`. Put the import at the top of the file.

```ts
import path from 'node:path'
```

```ts
const link = /\]\(([^)\s]+)\)/g
const notRelative = /^([a-z][a-z0-9+.-]*:|#|\/)/i

/**
 * Rewrites every relative markdown link in `markdown`. `sourcePath` is the repo path of the file
 * that holds the text. `toUrl` receives the repo path of the link target and returns the URL.
 */
export function rewriteLinks(markdown: string, sourcePath: string, toUrl: (repoPath: string) => string): string {
	const dir = path.posix.dirname(sourcePath)

	return markdown.replace(link, (match, target: string) => {
		if (notRelative.test(target)) {
			return match
		}

		const hash = target.indexOf('#')
		const file = hash === -1 ? target : target.slice(0, hash)
		const anchor = hash === -1 ? '' : target.slice(hash)
		const repoPath = path.posix.normalize(path.posix.join(dir, file))

		return `](${toUrl(repoPath)}${anchor})`
	})
}

/** The GitHub URL of a repo path. */
export function sourceUrl(repoPath: string): string {
	return sourceBase + repoPath
}

/**
 * Returns a `toUrl` for the docs site. `copies` maps a repo path to the path of its copy under the
 * site root. A target without a copy points at GitHub.
 */
export function siteUrl(copies: Map<string, string>): (repoPath: string) => string {
	return (repoPath) => {
		const copy = copies.get(repoPath)
		return copy === undefined ? sourceUrl(repoPath) : siteBase + copy
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 20 tests.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
npx eslint scripts/agentDocs.ts scripts/agentDocs.test.ts && npm run typecheck && git add scripts/agentDocs.ts scripts/agentDocs.test.ts && git commit -s -m "chore(scripts): rewrite relative links for the agent docs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Package loading and rendering

**Files:**
- Modify: `scripts/agentDocs.ts`
- Modify: `scripts/agentDocs.test.ts`

**Interfaces:**
- Consumes: `parseWhenToUse`, `readExports`, `checkExports`, `rewriteLinks` from Tasks 1 and 2, `projects` from `scripts/projects.ts`.
- Produces: `repoRoot: string`, `indexStart`, `indexEnd`, types `Guide` and `PackageDocs`, `loadPackageDocs(folder: string): PackageDocs`, `loadAllPackageDocs(): PackageDocs[]`, `siteCopies(packages: PackageDocs[]): Map<string, string>`, `renderIndex(packages: PackageDocs[]): string`, `renderReference(pkg: PackageDocs, toUrl: (repoPath: string) => string): string`, `replaceIndex(skill: string, index: string): string`, `renderLlmsTxt(packages: PackageDocs[]): string`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/agentDocs.test.ts`. Extend the import line to also name `indexEnd`, `indexStart`, `renderIndex`, `renderLlmsTxt`, `renderReference`, `replaceIndex`, `siteCopies`, and `type PackageDocs`.

```ts
function fixture(): PackageDocs {
	return {
		folder: 'libs/example',
		slug: 'example',
		name: '@svta/cml-example',
		description: 'Example package.',
		readme,
		guides: [{
			path: 'libs/example/docs/guide.md',
			title: 'Guide',
			description: 'A guide',
			text: '---\ntitle: Guide\ndescription: A guide\n---\n\n# Guide\n\nSee [the README](../README.md).\n',
		}],
		apiReportPath: 'libs/example/config/cml-example.api.md',
		apiReport: '```ts\nexport function readBoxes(): void;\n```\n',
		whenToUse: parseWhenToUse(readme, file),
	}
}

describe('siteCopies', () => {
	it('maps the README, every guide, and the API report of each package', () => {
		deepEqual([...siteCopies([fixture()])], [
			['libs/example/README.md', 'llms/example/README.md'],
			['libs/example/docs/guide.md', 'llms/example/docs/guide.md'],
			['libs/example/config/cml-example.api.md', 'llms/example/api.md'],
		])
	})
})

describe('renderIndex', () => {
	it('writes a heading, the description, the section body, and the reference per package', () => {
		equal(renderIndex([fixture()]), [
			'### @svta/cml-example',
			'',
			'Example package.',
			'',
			'- Parse boxes from a segment: `readBoxes`, `findBox`',
			'- Write `emsg` boxes: `writeEmsg`',
			'',
			'Do not write your own box parser.',
			'',
			'Reference: references/example.md',
		].join('\n'))
	})
})

describe('renderReference', () => {
	it('concatenates the sources with a path comment each and rewrites links', () => {
		const text = renderReference(fixture(), repoPath => `https://example.test/${repoPath}`)
		const expected = [
			'<!-- libs/example/README.md -->',
			readme.trimEnd(),
			'',
			'<!-- libs/example/docs/guide.md -->',
			'---\ntitle: Guide\ndescription: A guide\n---\n\n# Guide\n\nSee [the README](https://example.test/libs/example/README.md).',
			'',
			'<!-- libs/example/config/cml-example.api.md -->',
			'```ts\nexport function readBoxes(): void;\n```',
			'',
		].join('\n')
		equal(text, expected)
	})
})

describe('replaceIndex', () => {
	it('replaces the text between the markers and keeps the rest', () => {
		const skill = `# Skill\n\n${indexStart}\nold\n${indexEnd}\n\n## Links\n`
		equal(replaceIndex(skill, 'new'), `# Skill\n\n${indexStart}\n\nnew\n\n${indexEnd}\n\n## Links\n`)
	})

	it('throws when a marker is missing', () => {
		throws(() => replaceIndex('# Skill\n', 'new'), /markers .* are missing or out of order/)
	})
})

describe('renderLlmsTxt', () => {
	it('lists packages, guides, API reports, and the optional files', () => {
		const text = renderLlmsTxt([fixture()])
		equal(text.startsWith('# Common Media Library\n\n> '), true)
		equal(text.includes(`\n## Packages\n\n- [@svta/cml-example](${siteBase}llms/example/README.md): Example package.\n`), true)
		equal(text.includes(`\n## Guides\n\n- [Guide](${siteBase}llms/example/docs/guide.md): @svta/cml-example. A guide\n`), true)
		equal(text.includes(`\n## API reports\n\n- [@svta/cml-example API report](${siteBase}llms/example/api.md): `), true)
		equal(text.includes(`\n## Optional\n\n- [llms-full.txt](${siteBase}llms-full.txt): `), true)
		equal(text.includes('npx skills add streaming-video-technology-alliance/common-media-library'), true)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: FAIL, `siteCopies` is not exported.

- [ ] **Step 3: Write the loading and rendering functions**

Add to `scripts/agentDocs.ts`. Extend the imports at the top of the file:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { projects } from './projects.ts'
```

Add after the existing constants:

```ts
export const repoRoot = path.resolve(import.meta.dirname, '..')
export const indexStart = '<!-- packages:start -->'
export const indexEnd = '<!-- packages:end -->'
const installCommand = 'npx skills add streaming-video-technology-alliance/common-media-library'

export type Guide = {
	path: string;
	title: string;
	description: string;
	text: string;
};

export type PackageDocs = {
	folder: string;
	slug: string;
	name: string;
	description: string;
	readme: string;
	guides: Guide[];
	apiReportPath: string;
	apiReport: string;
	whenToUse: WhenToUse;
};
```

Add at the end of the file:

```ts
function readRepoFile(repoPath: string): string {
	return readFileSync(path.join(repoRoot, repoPath), 'utf8')
}

function loadGuide(repoPath: string): Guide {
	const text = readRepoFile(repoPath)
	const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
	const field = (key: string): string => front.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''

	return {
		path: repoPath,
		title: field('title') || path.posix.basename(repoPath, '.md'),
		description: field('description'),
		text,
	}
}

/** Reads one package and validates its When to use section against its API report. */
export function loadPackageDocs(folder: string): PackageDocs {
	const slug = path.posix.basename(folder)
	const json = JSON.parse(readRepoFile(`${folder}/package.json`)) as { name: string; description: string }
	const readmePath = `${folder}/README.md`
	const readme = readRepoFile(readmePath)
	const configDir = path.join(repoRoot, folder, 'config')
	const reportFile = existsSync(configDir) ? readdirSync(configDir).find(f => f.endsWith('.api.md')) : undefined

	if (reportFile === undefined) {
		throw new Error(`${folder}: no API report under config/. Build the package first.`)
	}

	const apiReportPath = `${folder}/config/${reportFile}`
	const apiReport = readRepoFile(apiReportPath)
	const docsDir = path.join(repoRoot, folder, 'docs')
	const guides = existsSync(docsDir)
		? readdirSync(docsDir).filter(f => f.endsWith('.md')).sort().map(f => loadGuide(`${folder}/docs/${f}`))
		: []
	const whenToUse = parseWhenToUse(readme, readmePath)

	checkExports(whenToUse, readExports(apiReport), readmePath)

	return { folder, slug, name: json.name, description: json.description, readme, guides, apiReportPath, apiReport, whenToUse }
}

/** Reads every published package, ordered by folder name. */
export function loadAllPackageDocs(): PackageDocs[] {
	return projects.map(loadPackageDocs).sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)
}

/** Maps the repo path of every file that the site copies to its path under the site root. */
export function siteCopies(packages: PackageDocs[]): Map<string, string> {
	const copies = new Map<string, string>()

	for (const pkg of packages) {
		copies.set(`${pkg.folder}/README.md`, `llms/${pkg.slug}/README.md`)
		for (const guide of pkg.guides) {
			copies.set(guide.path, `llms/${pkg.slug}/docs/${path.posix.basename(guide.path)}`)
		}
		copies.set(pkg.apiReportPath, `llms/${pkg.slug}/api.md`)
	}

	return copies
}

/** The package index that goes between the markers in SKILL.md. */
export function renderIndex(packages: PackageDocs[]): string {
	return packages.map(pkg => [
		`### ${pkg.name}`,
		'',
		pkg.description,
		'',
		pkg.whenToUse.text,
		'',
		`Reference: references/${pkg.slug}.md`,
	].join('\n')).join('\n\n')
}

/** The README, guides, and API report of one package in one markdown file. */
export function renderReference(pkg: PackageDocs, toUrl: (repoPath: string) => string): string {
	const sources: [string, string][] = [
		[`${pkg.folder}/README.md`, pkg.readme],
		...pkg.guides.map((guide): [string, string] => [guide.path, guide.text]),
		[pkg.apiReportPath, pkg.apiReport],
	]

	return sources
		.map(([repoPath, text]) => `<!-- ${repoPath} -->\n${rewriteLinks(text, repoPath, toUrl).trimEnd()}\n`)
		.join('\n')
}

/** Replaces the package index between the markers in SKILL.md. */
export function replaceIndex(skill: string, index: string): string {
	const start = skill.indexOf(indexStart)
	const end = skill.indexOf(indexEnd)

	if (start === -1 || end === -1 || end < start) {
		throw new Error(`${skillDir}/SKILL.md: the markers ${indexStart} and ${indexEnd} are missing or out of order.`)
	}

	return `${skill.slice(0, start + indexStart.length)}\n\n${index}\n\n${skill.slice(end)}`
}

/** The llms.txt index of the docs site. */
export function renderLlmsTxt(packages: PackageDocs[]): string {
	const skillUrl = `${sourceBase.replace('/blob/', '/tree/')}${skillDir}`

	return [
		'# Common Media Library',
		'',
		'> TypeScript libraries for web video players. Each package implements one media specification, such as CMCD, ID3, ISO BMFF, WebVTT, or DASH. Install only the packages that you need.',
		'',
		`Before you write code for a media specification in a player, check the package list below. The skill for coding agents installs with \`${installCommand}\`.`,
		'',
		'## Packages',
		'',
		...packages.map(pkg => `- [${pkg.name}](${siteBase}llms/${pkg.slug}/README.md): ${pkg.description}`),
		'',
		'## Guides',
		'',
		...packages.flatMap(pkg => pkg.guides.map(guide => `- [${guide.title}](${siteBase}llms/${pkg.slug}/docs/${path.posix.basename(guide.path)}): ${pkg.name}. ${guide.description}`)),
		'',
		'## API reports',
		'',
		...packages.map(pkg => `- [${pkg.name} API report](${siteBase}llms/${pkg.slug}/api.md): every public export of ${pkg.name} with its signature`),
		'',
		'## Optional',
		'',
		`- [llms-full.txt](${siteBase}llms-full.txt): every README, guide, and API report in one file`,
		`- [Agent skill](${skillUrl}): the Agent Skills bundle, install with \`${installCommand}\``,
		'',
	].join('\n')
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 26 tests.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
npx eslint scripts/agentDocs.ts scripts/agentDocs.test.ts && npm run typecheck && git add scripts/agentDocs.ts scripts/agentDocs.test.ts && git commit -s -m "chore(scripts): load package docs and render the skill index" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: When to use sections, first ten packages

**Files:**
- Modify: `libs/608/README.md`, `libs/abr/README.md`, `libs/c2pa/README.md`, `libs/cmaf-ham/README.md`, `libs/cmcd/README.md`, `libs/cmsd/README.md`, `libs/content-steering/README.md`, `libs/cta/README.md`, `libs/dash/README.md`, `libs/drm/README.md`
- Modify: the `CHANGELOG.md` beside each of those READMEs

**Interfaces:**
- Consumes: `loadPackageDocs` from Task 3 as the check.

Placement rule for every README: insert the section directly before the line `## Installation`, with one blank line before and after the section. The abr, c2pa, and error-codes READMEs have intro paragraphs before Installation. The section goes after those paragraphs.

Changelog rule for every package: under `## [Unreleased]`, if a `### Changed` heading exists, add the entry as the last bullet of that list. If not, insert `### Changed`, a blank line, and the entry directly after the `## [Unreleased]` line and its blank line. The entry is:

```md
- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.
```

- [ ] **Step 1: Add the ten sections**

`libs/608/README.md`:

```md
## When to use

- Extract CTA-608 caption bytes from an AVC or HEVC sample: `extractCta608DataFromSample`, `findCta608Nalus`
- Extract CTA-608 caption bytes from an AV1 sample: `extractCta608DataFromAv1Sample`
- Decode caption byte pairs into timed caption screens and cues: `Cta608Parser`, `CaptionScreen`
- Parse a Scenarist Closed Caption file: `SccParser`

Do not write your own SEI or OBU scanner, 608 command decoder, or caption screen model. Open an issue for a command or layout that is missing.
```

`libs/abr/README.md`:

```md
## When to use

- Pick a bitrate ladder rung from a throughput estimate and the buffer level: `createThroughputSelector`
- Implement a custom bitrate selection algorithm behind the shared interface: `BitrateSelector`, `BitrateSelectorInput`, `BitrateDecision`
- Feed segment download samples to a selector: `SegmentSample`
- Tune the safety factor, the upgrade factor, and the starvation tolerance: `ThroughputSelectorOptions`, `DEFAULT_SAFETY_FACTOR`

Do not write your own rung selection, hysteresis, or starvation guard. Open an issue for a selector type that is missing.
```

`libs/c2pa/README.md`:

```md
## When to use

- Validate the C2PA manifest in an init segment: `validateC2paInitSegment`
- Validate a media segment with any supported C2PA method: `validateC2paSegment`
- Validate a per-segment C2PA manifest box: `validateC2paManifestBoxSegment`
- Validate the Merkle leaf and proof in a VOD segment: `validateC2paMerkleSegment`
- Map a validation result to a status code: `C2paStatusCode`, `LiveVideoStatusCode`

Do not write your own COSE, CBOR, or manifest box parsing for C2PA. Open an issue for a validation method that is missing.
```

`libs/cmaf-ham/README.md`:

```md
## When to use

- Parse a DASH MPD into the CMAF-HAM presentation model: `dashToHam`, `parseDashManifest`
- Parse an HLS multivariant playlist into the CMAF-HAM presentation model: `hlsToHam`, `parseHlsManifest`
- Convert one manifest format to the other through the model: `hamToDash`, `hamToHls`
- Read the codec, duration, timescale, or segments of a track: `getCodec`, `getDuration`, `getTimescale`, `getSegments`
- Validate a presentation, a switching set, or a track: `validatePresentation`, `validateSwitchingSet`, `validateTrack`

Do not write your own DASH to HLS converter or manifest object model. Open an issue for a manifest feature that the model does not carry.
```

`libs/cmcd/README.md`:

```md
## When to use

- Add a CMCD report to a segment request as a query string or as headers: `appendCmcdQuery`, `appendCmcdHeaders`, `toCmcdQuery`, `toCmcdHeaders`
- Encode or decode CMCD key and value pairs: `encodeCmcd`, `decodeCmcd`, `fromCmcdQuery`, `fromCmcdHeaders`
- Report CMCD v2 events and time intervals to a collector: `CmcdReporter`, `createFetchTransport`, `createXhrTransport`
- Validate a CMCD payload against CTA-5004: `validateCmcd`, `validateCmcdEventReport`
- Capture the CMCD that a player sends in a test: `CmcdReportRecorder`

Do not write your own CMCD serializer, key sorter, header grouper, or event reporter. Open an issue for a key or a reporting mode that is missing.
```

`libs/cmsd/README.md`:

```md
## When to use

- Decode the CMSD-Static and CMSD-Dynamic response headers: `decodeCmsdStatic`, `decodeCmsdDynamic`
- Encode CMSD headers on a server or an edge: `encodeCmsdStatic`, `encodeCmsdDynamic`
- Type the CMSD keys and values that a player reads: `CmsdStatic`, `CmsdDynamic`, `CmsdObjectType`
- Tell a custom key from a standard key: `isCmsdCustomKey`

Do not write your own CMSD header parser or serializer. Open an issue for a key that is missing.
```

`libs/content-steering/README.md`:

```md
## When to use

- Validate a content steering manifest before the player applies it: `isValidSteeringManifest`
- Validate a pathway clone and its URI replacement: `isValidPathwayClone`
- Type the steering manifest, the pathway clones, and the URI replacements: `SteeringManifest`, `PathwayClone`, `UriReplacement`
- Apply the default TTL and pathway penalty of the specification: `DEFAULT_TTL`, `DEFAULT_PATHWAY_PENALTY`

Do not write your own steering manifest validation or types. Open an issue for a field that is missing.
```

`libs/cta/README.md`:

```md
## When to use

- Share the object type, stream type, and streaming format values between CMCD and CMSD: `CmObjectType`, `CmStreamType`, `CmStreamingFormat`
- Check a token field value in a CMCD or CMSD encoder: `isTokenField`, `isValid`

Do not import this package into a player directly. Use `@svta/cml-cmcd`, `@svta/cml-cmsd`, or `@svta/cml-608`, which depend on this package.
```

`libs/dash/README.md`:

```md
## When to use

- Expand a DASH SegmentTemplate URL with the $RepresentationID$, $Number$, $Bandwidth$, and $Time$ identifiers and their format tags: `processUriTemplate`
- Parse a DASH frame rate string such as 24000/1001: `parseFrameRate`
- Detect the DASH-IF thumbnail tile scheme on an EssentialProperty: `THUMBNAIL_TILE_SCHEME_ID_URI`

Do not write your own template expansion or frame rate parser. Open an issue for a DASH utility that is missing.
```

`libs/drm/README.md`:

```md
## When to use

- Parse the pssh boxes in init data and find the one for a key system: `parsePsshList`, `getPsshForKeySystem`, `getPsshData`
- Request key system access with a configuration built from codecs and robustness levels: `getKeySystemAccess`, `createMediaKeySystemConfiguration`, `getSupportedKeySystemConfiguration`
- Read the license request and its headers from an EME key message: `getLicenseRequestFromMessage`, `getRequestHeadersFromMessage`
- Read the license server URL from a ContentProtection element or a key message: `getLicenseServerUrl`, `getLicenseServerUrlFromContentProtection`
- Build FairPlay init data and decode a FairPlay license: `concatInitDataIdAndCertificate`, `extractContentId`, `decodeFairPlayLicense`
- Name key systems, UUIDs, encryption schemes, and robustness levels: `WIDEVINE_KEY_SYSTEM`, `PLAYREADY_UUID`, `EncryptionScheme`, `HW_SECURE_ALL`

Do not write your own pssh parser, key message decoder, or key system constant table. Open an issue for a key system or a message format that is missing.
```

- [ ] **Step 2: Check each section against its API report**

Run:

```bash
for p in 608 abr c2pa cmaf-ham cmcd cmsd content-steering cta dash drm; do node -e "import('./scripts/agentDocs.ts').then(m => { m.loadPackageDocs('libs/$p'); console.log('$p ok') })" || break; done
```

Expected: ten `ok` lines. If a line fails, the message names the README, the bullet, and the identifier. Fix the identifier to one that the API report under `libs/<pkg>/config/` exports. Do not loosen the parser.

- [ ] **Step 3: Add the ten changelog entries**

Apply the changelog rule above to `libs/608/CHANGELOG.md`, `libs/abr/CHANGELOG.md`, `libs/c2pa/CHANGELOG.md`, `libs/cmaf-ham/CHANGELOG.md`, `libs/cmcd/CHANGELOG.md`, `libs/cmsd/CHANGELOG.md`, `libs/content-steering/CHANGELOG.md`, `libs/cta/CHANGELOG.md`, `libs/dash/CHANGELOG.md`, and `libs/drm/CHANGELOG.md`. The cmcd changelog already has a `### Changed` list under Unreleased, so the entry joins that list.

Run: `grep -c "When to use section" libs/{608,abr,c2pa,cmaf-ham,cmcd,cmsd,content-steering,cta,dash,drm}/CHANGELOG.md`
Expected: `1` for every file.

- [ ] **Step 4: Commit**

```bash
git add libs/608 libs/abr libs/c2pa libs/cmaf-ham libs/cmcd libs/cmsd libs/content-steering libs/cta libs/dash libs/drm && git commit -s -m "docs: add When to use sections to ten package READMEs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: When to use sections, remaining ten packages

**Files:**
- Modify: `libs/error-codes/README.md`, `libs/id3/README.md`, `libs/iso-8601/README.md`, `libs/iso-bmff/README.md`, `libs/request/README.md`, `libs/structured-field-values/README.md`, `libs/throughput/README.md`, `libs/utils/README.md`, `libs/webvtt/README.md`, `libs/xml/README.md`
- Modify: the `CHANGELOG.md` beside each of those READMEs

The placement rule and the changelog rule from Task 4 apply unchanged.

- [ ] **Step 1: Add the ten sections**

`libs/error-codes/README.md`:

```md
## When to use

- Report a playback, network, DRM, or ad error with an SVTA2070 code: `SVTA_BUFFER_APPEND_ERROR`, `SVTA_BAD_LICENSE_REQUEST`
- Map an HTTP response status to an SVTA2070 code: `httpStatusToSvtaErrorCode`
- Map an IAB VAST error code to an SVTA2070 code: `vastErrorToSvtaErrorCode`
- Read the category or the index of a code: `getSvtaErrorCategory`, `getSvtaErrorIndex`

Do not define your own error code list for a player or an analytics pipeline. Open an issue for a condition that the specification does not name.
```

`libs/id3/README.md`:

```md
## When to use

- Read the ID3 frames in an HLS timed metadata sample or an emsg payload: `getId3Frames`, `getId3Data`
- Decode one frame, including text frames and private frames: `decodeId3Frame`, `decodeId3TextFrame`
- Read the PRIV timestamp that HLS uses to map ID3 time to media time: `getId3Timestamp`, `isId3TimestampFrame`
- Check that a buffer holds an ID3 tag: `canParseId3`, `isId3Header`, `isId3Footer`
- Match the ID3 emsg scheme in a DASH event stream: `ID3_SCHEME_ID_URI`

Do not write your own ID3 header, size, or frame parser. Open an issue for a frame type that is missing.
```

`libs/iso-8601/README.md`:

```md
## When to use

- Convert a DASH or HLS ISO 8601 duration such as PT1M30S to seconds: `decodeIso8601Duration`
- Format a number of seconds as an ISO 8601 duration: `encodeIso8601Duration`

Do not write your own duration regular expression. Open an issue for a duration form that does not decode.
```

`libs/iso-bmff/README.md`:

```md
## When to use

- Parse the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Parse boxes from a stream as the bytes arrive: `createIsoBoxReadableStream`, `IsoBoxReadableStream`
- Write or patch boxes, such as inserting emsg or rewriting tfdt: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`
- Read or write a box type that the package does not name: `IsoBoxReadView`, `IsoBoxWriteView`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.
```

`libs/request/README.md`:

```md
## When to use

- Type a segment, manifest, or license request that a player passes through a plugin: `CommonMediaRequest`
- Type the response that comes back, with timing and headers: `CommonMediaResponse`
- Adapt fetch or XMLHttpRequest to the common request and response types: `Requester`
- Hook into requests and responses, for example to add CMCD or to read CMSD: `RequestInterceptor`, `ResponseInterceptor`

Do not define your own request and response types for a plugin interface. Open an issue for a field that is missing.
```

`libs/structured-field-values/README.md`:

```md
## When to use

- Decode an RFC 8941 header such as CMCD, CMSD, or Priority into items, lists, or dictionaries: `decodeSfDict`, `decodeSfList`, `decodeSfItem`
- Encode a dictionary, a list, or an item as a structured field header: `encodeSfDict`, `encodeSfList`, `encodeSfItem`
- Represent an item with parameters or a token: `SfItem`, `SfToken`
- Parse one component of a field, such as a bare item or an inner list: `parseBareItem`, `parseInnerList`, `parseParameters`
- Serialize one component of a field: `serializeBareItem`, `serializeInnerList`, `serializeParams`

Do not write your own structured field tokenizer or serializer. Open an issue for an RFC 8941 form that fails to parse.
```

`libs/throughput/README.md`:

```md
## When to use

- Estimate throughput from segment downloads with an exponentially weighted moving average: `EwmaEstimator`
- Estimate throughput with a harmonic mean, an arithmetic mean, or a zero-lag EWMA: `HarmonicMeanEstimator`, `ArithmeticMeanEstimator`, `ZlemaEstimator`
- Implement a custom estimator behind the shared interface: `ThroughputEstimator`
- Tune the fast and slow half-lives of the EWMA: `EwmaEstimatorOptions`

Do not write your own EWMA or harmonic mean for bandwidth estimation. Open an issue for an estimator type that is missing.
```

`libs/utils/README.md`:

```md
## When to use

- Convert between hex, base64, UUID strings, and byte arrays: `hexToArrayBuffer`, `arrayBufferToHex`, `arrayBufferToUuid`, `uuidToArrayBuffer`, `decodeBase64`, `encodeBase64`
- Encode or decode UTF-8 and UTF-16 text: `encodeText`, `decodeText`, `Encoding`
- Resolve a base URL or make a URL relative to another URL: `getBaseUrl`, `urlToRelativePath`
- Compute bandwidth in bits per second from a byte count and a duration: `getBandwidthBps`
- Unescape HTML entities in a manifest or a caption string: `unescapeHtml`
- Generate a UUID for a session or a content id: `uuid`

Do not write your own hex, base64, or UUID conversion. Open an issue for a conversion that is missing.
```

`libs/webvtt/README.md`:

```md
## When to use

- Parse a WebVTT file or segment into cues, regions, and styles: `parseWebVtt`, `WebVttParser`
- Parse WebVTT chunks as the bytes arrive from a stream: `WebVttTransformStream`, `WebVttTransformer`
- Read the X-TIMESTAMP-MAP header of an HLS WebVTT segment: `TimestampMap`, `WebVttTimestampMapResult`
- Create native VTTCue and VTTRegion objects from parsed cues: `toVttCue`, `toVttRegion`
- Build cues and regions without a browser, for tests or servers: `createWebVttCue`, `createWebVttRegion`

Do not write your own WebVTT tokenizer, cue timing parser, or timestamp map handling. Open an issue for a cue setting that is missing.
```

`libs/xml/README.md`:

```md
## When to use

- Parse a DASH MPD or another XML document into a node tree: `parseXml`
- Find elements by name anywhere in the tree: `getElementsByName`
- Serialize a node tree back to an XML string: `serializeXml`
- Control attribute and namespace handling during a parse: `XmlParseOptions`

Do not write your own XML tokenizer for manifests. Open an issue for an XML form that fails to parse.
```

- [ ] **Step 2: Check each section against its API report**

Run:

```bash
for p in error-codes id3 iso-8601 iso-bmff request structured-field-values throughput utils webvtt xml; do node -e "import('./scripts/agentDocs.ts').then(m => { m.loadPackageDocs('libs/$p'); console.log('$p ok') })" || break; done
```

Expected: ten `ok` lines. Fix any named identifier as in Task 4.

- [ ] **Step 3: Add the ten changelog entries**

Apply the changelog rule from Task 4 to the ten `CHANGELOG.md` files.

Run: `grep -c "When to use section" libs/{error-codes,id3,iso-8601,iso-bmff,request,structured-field-values,throughput,utils,webvtt,xml}/CHANGELOG.md`
Expected: `1` for every file.

- [ ] **Step 4: Commit**

```bash
git add libs/error-codes libs/id3 libs/iso-8601 libs/iso-bmff libs/request libs/structured-field-values libs/throughput libs/utils libs/webvtt libs/xml && git commit -s -m "docs: add When to use sections to the remaining package READMEs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Integration test over every published package

**Files:**
- Modify: `scripts/agentDocs.test.ts`

**Interfaces:**
- Consumes: `loadAllPackageDocs` from Task 3, `projects` from `scripts/projects.ts`.

- [ ] **Step 1: Write the test**

Append to `scripts/agentDocs.test.ts`. Add `loadAllPackageDocs` to the import from `./agentDocs.ts` and add `import { projects } from './projects.ts'`.

```ts
describe('published packages', () => {
	it('every published package has a When to use section whose exports exist', () => {
		const packages = loadAllPackageDocs()
		equal(packages.length, projects.length)
		for (const pkg of packages) {
			equal(pkg.whenToUse.bullets.length >= 2, true, `${pkg.name} has too few bullets`)
		}
	})
})
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 27 tests. If the new test fails, the message names a README and a bullet. Fix that README, not the test.

- [ ] **Step 3: Commit**

```bash
npx eslint scripts/agentDocs.test.ts && git add scripts/agentDocs.test.ts && git commit -s -m "test(scripts): check the When to use section of every published package" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: SKILL.md, skill generation, build hook, CI step

**Files:**
- Create: `skills/common-media-library/SKILL.md`
- Create: `skills/common-media-library/references/<slug>.md` (generated, 20 files)
- Modify: `scripts/agentDocs.ts`
- Modify: `scripts/agentDocs.test.ts`
- Modify: `scripts/buildAll.ts`
- Modify: `.github/workflows/ci.pr.yml`

**Interfaces:**
- Consumes: `loadAllPackageDocs`, `renderIndex`, `renderReference`, `replaceIndex`, `sourceUrl`, `repoRoot`, `skillDir` from Tasks 2 and 3.
- Produces: `writeSkill(): void`, the CLI flag `--skill`.

- [ ] **Step 1: Write SKILL.md**

Create `skills/common-media-library/SKILL.md` with this exact content:

````md
---
name: common-media-library
description: Find the @svta/cml-* package and function for a media playback task before writing code for it. Use when working in a web video player, HLS or DASH client, or media pipeline and the task involves ISO BMFF or MP4 boxes such as moov, moof, emsg, tfdt, or sidx, CMCD, CMSD, ID3 tags, WebVTT, CEA-608 or CTA-608 captions, DASH MPD parsing, DRM or EME key systems, throughput estimation, ABR or bitrate selection, content steering, structured field values (RFC 8941), C2PA, ISO 8601 durations, XML parsing, or streaming error codes. Also use when a cml package seems to have a bug or a missing feature.
license: Apache-2.0
metadata:
  author: streaming-video-technology-alliance
---

# Common Media Library

The Common Media Library (CML) is a set of TypeScript packages for web video players. Each package implements one media specification. The packages have no dependencies outside CML and are tree-shakeable, so a player pays only for the functions that it imports.

## Before you write code

1. Find the task in the package index below. Match on the task, not on a function name.
2. If a package covers the task, install it and import the named exports. Do not write the parser, encoder, estimator, or selector yourself, even when the code looks short.
3. If the package is installed, read `node_modules/@svta/cml-<name>/dist/index.d.ts` for the exact signatures. If it is not installed, read the reference file of the package under `references/`.

Install one package with npm. npm installs the CML peer dependencies of the package with it.

```bash
npm i @svta/cml-iso-bmff
```

## When no package covers the task

Write the smallest piece in the project. Open a feature request at https://github.com/streaming-video-technology-alliance/common-media-library/issues/new?template=feature_request.md with the use case. Leave the issue URL in a comment next to the code. Do not copy source from a cml package into the project.

## When a cml package has a bug

1. Confirm the bug against the built package with a minimal script.
2. Open a bug report at https://github.com/streaming-video-technology-alliance/common-media-library/issues/new?template=bug_report.md with that script.
3. Work around the bug with a wrapper around the call or with a local patch. Mark the workaround with a TODO and the issue URL.

Do not reimplement the function and do not copy the source. A fix in CML reaches every player. A copy in the project becomes the player's own spec implementation to maintain.

## Package index

<!-- packages:start -->
<!-- packages:end -->

## Links

- Docs: https://streaming-video-technology-alliance.github.io/common-media-library/
- llms.txt: https://streaming-video-technology-alliance.github.io/common-media-library/llms.txt
- Source: https://github.com/streaming-video-technology-alliance/common-media-library
````

- [ ] **Step 2: Write the failing test**

Append to `scripts/agentDocs.test.ts`. Add `repoRoot`, `skillDir`, and `writeSkill` to the import from `./agentDocs.ts`, and add `import { existsSync, readFileSync } from 'node:fs'` and `import path from 'node:path'`.

```ts
describe('writeSkill', () => {
	it('writes an index for every package and a reference file per package, under 500 lines', () => {
		writeSkill()
		const skill = readFileSync(path.join(repoRoot, skillDir, 'SKILL.md'), 'utf8')
		equal(skill.split('\n').length < 500, true, 'SKILL.md has 500 lines or more')
		for (const folder of projects) {
			const slug = path.posix.basename(folder)
			equal(skill.includes(`\nReference: references/${slug}.md\n`), true, `${slug} is missing from the index`)
			equal(existsSync(path.join(repoRoot, skillDir, 'references', `${slug}.md`)), true, `references/${slug}.md is missing`)
		}
	})
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: FAIL, `writeSkill` is not exported.

- [ ] **Step 4: Write writeSkill and the CLI**

In `scripts/agentDocs.ts`, extend the `node:fs` import to `import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'` and add `import { parseArgs } from 'node:util'`. Append:

```ts
/** Regenerates the package index in SKILL.md and one reference file per published package. */
export function writeSkill(): void {
	const packages = loadAllPackageDocs()
	const dir = path.join(repoRoot, skillDir)
	const skillPath = path.join(dir, 'SKILL.md')
	const refs = path.join(dir, 'references')
	const slugs = new Set(packages.map(pkg => `${pkg.slug}.md`))

	mkdirSync(refs, { recursive: true })
	writeFileSync(skillPath, replaceIndex(readFileSync(skillPath, 'utf8'), renderIndex(packages)))

	for (const file of readdirSync(refs)) {
		if (!slugs.has(file)) {
			rmSync(path.join(refs, file))
		}
	}

	for (const pkg of packages) {
		writeFileSync(path.join(refs, `${pkg.slug}.md`), renderReference(pkg, sourceUrl))
	}
}

if (import.meta.main) {
	const { values } = parseArgs({ options: { skill: { type: 'boolean' }, site: { type: 'string' } } })

	if (!values.skill && values.site === undefined) {
		throw new Error('Pass --skill, --site <dir>, or both.')
	}

	if (values.skill) {
		writeSkill()
		console.log(`Wrote ${skillDir}`)
	}
}
```

The `--site` branch is added in Task 8.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 28 tests. The run also writes the skill files.

- [ ] **Step 6: Inspect the generated files**

Run: `wc -l skills/common-media-library/SKILL.md skills/common-media-library/references/*.md | tail -1 && sed -n '/packages:start/,/^### @svta\/cml-abr/p' skills/common-media-library/SKILL.md && head -5 skills/common-media-library/references/iso-bmff.md && grep -c 'blob/main/libs/iso-bmff/docs/' skills/common-media-library/references/iso-bmff.md`

Expected: SKILL.md under 500 lines. The index starts with `### @svta/cml-608`, then its description and section. The iso-bmff reference starts with `<!-- libs/iso-bmff/README.md -->` and contains three rewritten guide links.

- [ ] **Step 7: Call writeSkill from the root build**

In `scripts/buildAll.ts`, add `import { skillDir, writeSkill } from './agentDocs.ts'` after the `processTree.ts` import. Inside the `try` block, after the `console.log` that reports the package count, add:

```ts
	writeSkill()
	console.log(`Wrote ${skillDir}`)
```

Run: `npm run build`
Expected: the last line is `Wrote skills/common-media-library`. `git status --short skills` shows no change, because Step 5 already wrote the same content.

- [ ] **Step 8: Add the CI step**

In `.github/workflows/ci.pr.yml`, after the `Test` step and before the commented `Change Log` step, add:

```yaml
      - name: Generated skill files are current
        run: git diff --exit-code -- skills
```

Keep the indentation of the neighbouring steps, six spaces before the dash.

- [ ] **Step 9: Lint, typecheck, commit**

```bash
npx eslint scripts && npm run typecheck && git add skills scripts/agentDocs.ts scripts/agentDocs.test.ts scripts/buildAll.ts .github/workflows/ci.pr.yml && git commit -s -m "feat: add an Agent Skills bundle generated from the package READMEs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Site mode and the docs build

**Files:**
- Modify: `scripts/agentDocs.ts`
- Modify: `scripts/agentDocs.test.ts`
- Modify: `docs/package.json`

**Interfaces:**
- Consumes: `loadAllPackageDocs`, `siteCopies`, `siteUrl`, `rewriteLinks`, `renderReference`, `renderLlmsTxt` from Tasks 2 and 3.
- Produces: `writeSite(outDir: string): void`, the CLI flag `--site <dir>`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/agentDocs.test.ts`. Add `writeSite` to the import from `./agentDocs.ts`, and add `import { mkdtempSync } from 'node:fs'` and `import { tmpdir } from 'node:os'` beside the other imports.

```ts
describe('writeSite', () => {
	it('writes llms.txt, llms-full.txt, and a markdown copy of every source', () => {
		const out = mkdtempSync(path.join(tmpdir(), 'agent-docs-'))
		writeSite(out)
		const index = readFileSync(path.join(out, 'llms.txt'), 'utf8')
		const full = readFileSync(path.join(out, 'llms-full.txt'), 'utf8')
		equal(index.includes(`- [@svta/cml-iso-bmff](${siteBase}llms/iso-bmff/README.md): `), true)
		equal(existsSync(path.join(out, 'llms/iso-bmff/README.md')), true)
		equal(existsSync(path.join(out, 'llms/iso-bmff/docs/reading-boxes.md')), true)
		equal(existsSync(path.join(out, 'llms/iso-bmff/api.md')), true)
		const readme = readFileSync(path.join(out, 'llms/iso-bmff/README.md'), 'utf8')
		equal(readme.includes(`](${siteBase}llms/iso-bmff/docs/reading-boxes.md)`), true, 'README links point at the site copies')
		equal(full.includes('<!-- libs/iso-bmff/README.md -->'), true)
		equal(full.includes('<!-- libs/cmcd/docs/user-guide.md -->'), true)
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: FAIL, `writeSite` is not exported.

- [ ] **Step 3: Write writeSite and the CLI branch**

In `scripts/agentDocs.ts`, add before the `if (import.meta.main)` block:

```ts
/** Writes llms.txt, llms-full.txt, and markdown copies of every source into the docs output. */
export function writeSite(outDir: string): void {
	const packages = loadAllPackageDocs()
	const copies = siteCopies(packages)
	const toUrl = siteUrl(copies)

	for (const [repoPath, copy] of copies) {
		const target = path.join(outDir, copy)
		mkdirSync(path.dirname(target), { recursive: true })
		writeFileSync(target, rewriteLinks(readRepoFile(repoPath), repoPath, toUrl))
	}

	writeFileSync(path.join(outDir, 'llms.txt'), renderLlmsTxt(packages))
	writeFileSync(path.join(outDir, 'llms-full.txt'), packages.map(pkg => renderReference(pkg, toUrl)).join('\n'))
}
```

Inside the `if (import.meta.main)` block, after the `--skill` branch, add:

```ts
	if (values.site !== undefined) {
		const out = path.resolve(process.cwd(), values.site)
		writeSite(out)
		console.log(`Wrote llms.txt to ${out}`)
	}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --no-warnings --test scripts/agentDocs.test.ts`
Expected: PASS, 29 tests.

- [ ] **Step 5: Run the site mode from the docs build**

In `docs/package.json`, change the build script to:

```json
		"build": "typedoc && node ../scripts/agentDocs.ts --site dist",
```

Run: `npm run build -w docs && ls docs/dist/llms.txt docs/dist/llms-full.txt && ls docs/dist/llms | wc -l && head -12 docs/dist/llms.txt && wc -c docs/dist/llms-full.txt`

Expected: both files exist, 20 package folders under `llms/`, the index starts with the H1 and the blockquote, llms-full.txt is near 300 KB.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
npx eslint scripts && npm run typecheck && git add scripts/agentDocs.ts scripts/agentDocs.test.ts docs/package.json && git commit -s -m "feat(docs): publish llms.txt and markdown copies of the package docs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: AGENTS.md, root README, full verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1: Add the dependency rule and the section rule to AGENTS.md**

Under `## Workflow`, after the bullet that starts with `- Avoid breaking changes.`, add:

```md
- If a third-party dependency has a bug, open an issue in that project and work around the bug locally with a wrapper or a patch. Do not copy or reimplement the dependency's code.
```

Under `## Documentation`, after the bullet that starts with `- Every package needs a `README.md``, add:

```md
- Every package README needs a `## When to use` section: two to eight task bullets with their entry-point exports, then a closing paragraph. `scripts/agentDocs.ts` reads the section. The root build regenerates `skills/common-media-library` from it. Commit the result.
```

- [ ] **Step 2: Add the Coding agents section to the root README**

In `README.md`, after the `## Documentation` section and before `## Community`, add:

````md
## Coding agents

The repository ships a skill that tells a coding agent which package covers a media playback task. Install the skill in a player project:

```bash
npx skills add streaming-video-technology-alliance/common-media-library
```

Agents that read documentation from the web can start at [llms.txt](https://streaming-video-technology-alliance.github.io/common-media-library/llms.txt).
````

- [ ] **Step 3: Run the full validation**

Run: `npm test 2>&1 | tail -30`
Expected: lint, build, typecheck, and every package test pass. The root scripts tests include the 29 agentDocs tests.

- [ ] **Step 4: Confirm the generated files are current**

Run: `git status --short && git diff --exit-code -- skills && echo current`
Expected: only `AGENTS.md` and `README.md` are modified, and the last line is `current`.

- [ ] **Step 5: Check the skill frontmatter against the Agent Skills specification**

Run: `sed -n 2p skills/common-media-library/SKILL.md && sed -n 3p skills/common-media-library/SKILL.md | wc -c`
Expected: the second line is exactly `name: common-media-library`, which matches the directory name, and the description line is under 1024 characters.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md README.md && git commit -s -m "docs: point contributors and coding agents at the skill and llms.txt" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 7: Report**

Report the commit list with `git log --oneline main..HEAD`. The `plans/agent-docs/` folder stays on the branch until the PR is ready. Delete it in the PR before merge, per AGENTS.md. Do not open the PR: Casey runs `/create-pr`.
