import { deepEqual, equal, throws } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkExports, parseWhenToUse, readExports, rewriteLinks, siteBase, siteUrl, sourceBase, sourceUrl } from './agentDocs.ts'

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
