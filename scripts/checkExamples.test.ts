import { deepEqual, equal, ok } from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { checkExamples, extractExampleBlocks, formatDiagnostic, listExampleFiles, type ExampleBlock } from './checkExamples.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

describe('extractExampleBlocks', () => {
	it('returns the ts and typescript fences with the line of the opening fence', () => {
		const markdown = '# Title\n\n```typescript\nconst a = 1\n```\n\ntext\n\n```ts\nconst b = 2\n```\n'
		deepEqual(extractExampleBlocks(markdown, 'libs/x/README.md'), [
			{ file: 'libs/x/README.md', line: 3, code: 'const a = 1\n' },
			{ file: 'libs/x/README.md', line: 9, code: 'const b = 2\n' },
		])
	})

	it('ignores fences of other languages and fences nested in them', () => {
		const markdown = '```bash\nnpm install\n```\n\n````markdown\n```typescript\nnot code\n```\n````\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [])
	})

	it('keeps blank lines inside a block', () => {
		const markdown = '```typescript\nconst a = 1\n\nconst b = 2\n```\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [{ file: 'f.md', line: 1, code: 'const a = 1\n\nconst b = 2\n' }])
	})
})

describe('listExampleFiles', () => {
	it('lists the root README, the package READMEs, and the guides', () => {
		const files = listExampleFiles(repoRoot)
		ok(files.includes('README.md'))
		ok(files.includes('libs/cmcd/README.md'))
		ok(files.includes('libs/cmcd/docs/user-guide.md'))
		ok(!files.some(file => file.includes('node_modules') || file.includes('/dist/')))
	})
})

describe('checkExamples', () => {
	it('reports a type error at the markdown line', () => {
		const block: ExampleBlock = { file: 'libs/x/docs/guide.md', line: 10, code: 'const n: number = 1\nconst s: number = "a"\nconsole.log(n, s)\n' }
		const diagnostics = checkExamples([block], repoRoot)
		equal(diagnostics.length, 1)
		equal(diagnostics[0].code, 2322)
		equal(diagnostics[0].file, 'libs/x/docs/guide.md')
		equal(diagnostics[0].line, 12)
		equal(formatDiagnostic(diagnostics[0]), 'libs/x/docs/guide.md:12 TS2322: Type \'string\' is not assignable to type \'number\'.')
	})

	it('resolves package imports to the built packages', () => {
		const block: ExampleBlock = { file: 'libs/x/README.md', line: 1, code: 'import { appendCmcdQuery } from "@svta/cml-cmcd";\nconsole.log(appendCmcdQuery("https://cdn.example.com/a.m4s", { br: [1000] }));\n' }
		deepEqual(checkExamples([block], repoRoot), [])
	})

	it('accepts top-level await and the same declare in two blocks', () => {
		const code = 'declare const url: string\nconst response = await fetch(url)\nconsole.log(response.status)\n'
		const blocks: ExampleBlock[] = [{ file: 'a.md', line: 1, code }, { file: 'b.md', line: 1, code }]
		deepEqual(checkExamples(blocks, repoRoot), [])
	})

	it('fails when an expected error does not occur', () => {
		const block: ExampleBlock = { file: 'f.md', line: 1, code: '// @ts-expect-error\nconst n: number = 1\nconsole.log(n)\n' }
		equal(checkExamples([block], repoRoot)[0]?.code, 2578)
	})
})
