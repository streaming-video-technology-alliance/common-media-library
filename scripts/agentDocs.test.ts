import { deepEqual, equal, throws } from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import {
	checkExports,
	indexEnd,
	indexStart,
	loadAllPackageDocs,
	parseWhenToUse,
	readExports,
	renderIndex,
	renderLlmsTxt,
	renderReference,
	repoRoot,
	replaceIndex,
	rewriteLinks,
	siteBase,
	siteCopies,
	siteUrl,
	skillDir,
	sourceBase,
	sourceUrl,
	writeSite,
	writeSkill,
	type PackageDocs,
} from './agentDocs.ts'
import { projects } from './projects.ts'

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
		deepEqual(
			section.bullets.map(b => b.task),
			['Parse boxes from a segment', 'Write `emsg` boxes'],
		)
		deepEqual(
			section.bullets.map(b => b.exports),
			[['readBoxes', 'findBox'], ['writeEmsg']],
		)
		equal(section.closing, 'Do not write your own box parser.')
	})

	it('keeps the section body verbatim without the heading', () => {
		const section = parseWhenToUse(readme, file)
		equal(
			section.text,
			'- Parse boxes from a segment: `readBoxes`, `findBox`\n- Write `emsg` boxes: `writeEmsg`\n\nDo not write your own box parser.',
		)
	})

	it('stops at the next heading', () => {
		const section = parseWhenToUse(`${readme}\n- Not a task: \`nope\`\n`, file)
		equal(section.bullets.length, 2)
	})

	it('throws when the heading is missing', () => {
		throws(
			() => parseWhenToUse('# x\n\n## Installation\n', file),
			/libs\/example\/README\.md: the heading is missing/,
		)
	})

	it('throws when a bullet has no colon', () => {
		throws(
			() =>
				parseWhenToUse(
					'## When to use\n\n- Parse boxes `readBoxes`\n- Two: `a`\n\nClosing.\n',
					file,
				),
			/the bullet "Parse boxes `readBoxes`" has no colon/,
		)
	})

	it('throws when a bullet names no export after the colon', () => {
		throws(
			() =>
				parseWhenToUse('## When to use\n\n- Parse boxes: nothing\n- Two: `a`\n\nClosing.\n', file),
			/names no export after the colon/,
		)
	})

	it('throws when text other than an export list follows the colon', () => {
		throws(
			() =>
				parseWhenToUse(
					'## When to use\n\n- Parse boxes: `a` and `b`\n- Two: `a`\n\nClosing.\n',
					file,
				),
			/text after the colon that is not an export list/,
		)
	})

	it('throws when the closing paragraph is missing', () => {
		throws(
			() => parseWhenToUse('## When to use\n\n- One: `a`\n- Two: `b`\n\n## Installation\n', file),
			/the closing paragraph is missing/,
		)
	})

	it('throws when there are too few or too many bullets', () => {
		throws(
			() => parseWhenToUse('## When to use\n\n## Installation\n', file),
			/the section has 0 bullets/,
		)
		const many = Array.from({ length: 9 }, (_, i) => `- Task ${i}: \`a\``).join('\n')
		throws(
			() => parseWhenToUse(`## When to use\n\n${many}\n\nClosing.\n`, file),
			/the section has 9 bullets/,
		)
	})

	it('throws when text comes before the first bullet', () => {
		throws(
			() =>
				parseWhenToUse('## When to use\n\nIntro.\n\n- One: `a`\n- Two: `b`\n\nClosing.\n', file),
			/comes before the first bullet/,
		)
	})
})

describe('readExports', () => {
	it('maps function, const, class, and type names to a release tag', () => {
		const report =
			'```ts\n\nexport function readBoxes(): void;\n\nexport const DATA = 1;\n\nexport class Box {}\n\nexport type Emsg = {};\n\n// @public\nexport function readBoxes(a: number): void;\n```'
		deepEqual([...readExports(report)].sort(), [
			['Box', 'public'],
			['DATA', 'public'],
			['Emsg', 'public'],
			['readBoxes', 'public'],
		])
	})

	it('maps the names inside an export list to public and takes the name after as', () => {
		const report = '```ts\n\nexport { Event_2 as Event }\n\nexport { XmlNode }\n```'
		deepEqual([...readExports(report)].sort(), [
			['Event', 'public'],
			['XmlNode', 'public'],
		])
	})

	it('maps a name to the release tag on the line above its declaration', () => {
		const report =
			'```ts\n\n// @internal\nexport function hidden(): void;\n\n// @beta (undocumented)\nexport const LATER = 1;\n\n// @public\nexport function shown(): void;\n```'
		deepEqual([...readExports(report)].sort(), [
			['LATER', 'beta'],
			['hidden', 'internal'],
			['shown', 'public'],
		])
	})
})

describe('checkExports', () => {
	const all = new Map([
		['readBoxes', 'public'],
		['findBox', 'public'],
		['writeEmsg', 'public'],
	])

	it('throws for an identifier that is not an export and names the bullet', () => {
		const section = parseWhenToUse(readme, file)
		throws(
			() =>
				checkExports(
					section,
					new Map([
						['readBoxes', 'public'],
						['writeEmsg', 'public'],
					]),
					file,
				),
			/libs\/example\/README\.md: "findBox" in the bullet "Parse boxes from a segment: `readBoxes`, `findBox`" is not an export/,
		)
	})

	it('throws for an identifier that the API report marks as internal', () => {
		const section = parseWhenToUse('## When to use\n\n- Hide a box: `hidden`\n\nClosing.\n', file)
		throws(
			() =>
				checkExports(
					section,
					readExports('```ts\n\n// @internal\nexport function hidden(): void;\n```'),
					file,
				),
			/libs\/example\/README\.md: "hidden" in the bullet "Hide a box: `hidden`" is marked @internal\. Name a public entry point\./,
		)
	})

	it('accepts a section whose identifiers are all exports', () => {
		const section = parseWhenToUse(readme, file)
		checkExports(section, all, file)
	})
})

describe('rewriteLinks', () => {
	const toUrl = (repoPath: string): string => `https://example.test/${repoPath}`

	it('resolves a README link to a guide against the package folder', () => {
		equal(
			rewriteLinks('[Reading](docs/reading-boxes.md)', 'libs/iso-bmff/README.md', toUrl),
			'[Reading](https://example.test/libs/iso-bmff/docs/reading-boxes.md)',
		)
	})

	it('resolves a guide link to a sibling guide and keeps the anchor', () => {
		equal(
			rewriteLinks(
				'[Keys](./user-guide.md#custom-keys)',
				'libs/cmcd/docs/validation-guide.md',
				toUrl,
			),
			'[Keys](https://example.test/libs/cmcd/docs/user-guide.md#custom-keys)',
		)
	})

	it('resolves a link that leaves the package', () => {
		equal(
			rewriteLinks('[Root](../../README.md)', 'libs/cmcd/README.md', toUrl),
			'[Root](https://example.test/README.md)',
		)
	})

	it('leaves absolute links, anchors, and root-relative links alone', () => {
		const text = '[a](https://x.y/z) [b](#top) [c](/abs.md) [d](mailto:x@y.z)'
		equal(rewriteLinks(text, 'libs/cmcd/README.md', toUrl), text)
	})

	it('rewrites every link in a document', () => {
		equal(
			rewriteLinks('[a](a.md) and [b](b.md)', 'libs/x/README.md', toUrl),
			'[a](https://example.test/libs/x/a.md) and [b](https://example.test/libs/x/b.md)',
		)
	})

	it('leaves the content of fenced code blocks alone', () => {
		const text = '[a](a.md)\n```ts\nx[a](b)\n```\n[b](b.md)'
		equal(
			rewriteLinks(text, 'libs/x/README.md', toUrl),
			'[a](https://example.test/libs/x/a.md)\n```ts\nx[a](b)\n```\n[b](https://example.test/libs/x/b.md)',
		)
	})
})

describe('sourceUrl', () => {
	it('prefixes the source base', () => {
		equal(sourceUrl('libs/cmcd/README.md'), `${sourceBase}libs/cmcd/README.md`)
	})
})

describe('siteUrl', () => {
	it('points a copied file at the site and any other file at the source', () => {
		const toUrl = siteUrl(
			new Map([['libs/iso-bmff/docs/reading-boxes.md', 'llms/iso-bmff/docs/reading-boxes.md']]),
		)
		equal(
			toUrl('libs/iso-bmff/docs/reading-boxes.md'),
			`${siteBase}llms/iso-bmff/docs/reading-boxes.md`,
		)
		equal(toUrl('libs/iso-bmff/src/index.ts'), `${sourceBase}libs/iso-bmff/src/index.ts`)
	})
})

function fixture(): PackageDocs {
	return {
		folder: 'libs/example',
		slug: 'example',
		name: '@svta/cml-example',
		description: 'Example package.',
		readme,
		guides: [
			{
				path: 'libs/example/docs/guide.md',
				title: 'Guide',
				description: 'A guide',
				text: '---\ntitle: Guide\ndescription: A guide\n---\n\n# Guide\n\nSee [the README](../README.md).\n',
			},
		],
		apiReportPath: 'libs/example/config/cml-example.api.md',
		apiReport: '```ts\nexport function readBoxes(): void;\n```\n',
		whenToUse: parseWhenToUse(readme, file),
	}
}

describe('siteCopies', () => {
	it('maps the README, every guide, and the API report of each package', () => {
		deepEqual(
			[...siteCopies([fixture()])],
			[
				['libs/example/README.md', 'llms/example/README.md'],
				['libs/example/docs/guide.md', 'llms/example/docs/guide.md'],
				['libs/example/config/cml-example.api.md', 'llms/example/api.md'],
			],
		)
	})
})

describe('renderIndex', () => {
	it('writes a heading, the description, the section body, and the reference per package', () => {
		equal(
			renderIndex([fixture()]),
			[
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
			].join('\n'),
		)
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
		equal(
			replaceIndex(skill, 'new'),
			`# Skill\n\n${indexStart}\n\nnew\n\n${indexEnd}\n\n## Links\n`,
		)
	})

	it('throws when a marker is missing', () => {
		throws(() => replaceIndex('# Skill\n', 'new'), /markers .* are missing or out of order/)
	})
})

describe('renderLlmsTxt', () => {
	it('lists packages, guides, API reports, and the optional files', () => {
		const text = renderLlmsTxt([fixture()])
		equal(text.startsWith('# Common Media Library\n\n> '), true)
		equal(
			text.includes(
				`\n## Packages\n\n- [@svta/cml-example](${siteBase}llms/example/README.md): Example package.\n  - Parse boxes from a segment: \`readBoxes\`, \`findBox\`\n  - Write \`emsg\` boxes: \`writeEmsg\`\n\n## Guides`,
			),
			true,
		)
		equal(
			text.includes(
				`\n## Guides\n\n- [Guide](${siteBase}llms/example/docs/guide.md): @svta/cml-example. A guide\n`,
			),
			true,
		)
		equal(
			text.includes(
				`\n## API reports\n\n- [@svta/cml-example API report](${siteBase}llms/example/api.md): `,
			),
			true,
		)
		equal(text.includes(`\n## Optional\n\n- [llms-full.txt](${siteBase}llms-full.txt): `), true)
		equal(
			text.includes('npx skills add streaming-video-technology-alliance/common-media-library'),
			true,
		)
	})
})

describe('published packages', () => {
	it('every published package loads, so each When to use section parses and names real exports', () => {
		// loadPackageDocs throws on a missing section, a malformed bullet, or an identifier that the API report does not export.
		const packages = loadAllPackageDocs()
		deepEqual(packages.map(pkg => pkg.folder).sort(), [...projects].sort())
	})
})

describe('writeSkill', () => {
	it('writes an index for every package and a reference file per package, under 500 lines', () => {
		writeSkill()
		const skill = readFileSync(path.join(repoRoot, skillDir, 'SKILL.md'), 'utf8')
		equal(skill.split('\n').length < 500, true, 'SKILL.md has 500 lines or more')
		for (const folder of projects) {
			const slug = path.posix.basename(folder)
			equal(
				skill.includes(`\nReference: references/${slug}.md\n`),
				true,
				`${slug} is missing from the index`,
			)
			equal(
				existsSync(path.join(repoRoot, skillDir, 'references', `${slug}.md`)),
				true,
				`references/${slug}.md is missing`,
			)
		}

		const isoBmffPath = path.join(repoRoot, skillDir, 'references', 'iso-bmff.md')
		const isoBmff = readFileSync(isoBmffPath, 'utf8')

		writeSkill()
		equal(
			readFileSync(path.join(repoRoot, skillDir, 'SKILL.md'), 'utf8'),
			skill,
			'a second writeSkill call changed SKILL.md',
		)
		equal(
			readFileSync(isoBmffPath, 'utf8'),
			isoBmff,
			'a second writeSkill call changed references/iso-bmff.md',
		)
	})
})

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
		equal(
			readme.includes(`](${siteBase}llms/iso-bmff/docs/reading-boxes.md)`),
			true,
			'README links point at the site copies',
		)
		equal(full.includes('<!-- libs/iso-bmff/README.md -->'), true)
		equal(full.includes('<!-- libs/cmcd/docs/user-guide.md -->'), true)
	})
})
