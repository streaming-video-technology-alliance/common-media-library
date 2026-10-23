import { deepEqual, equal, ok } from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { checkExamples, extractExampleBlocks, formatDiagnostic, listExampleFiles, parseExampleContext, readExampleBlocks, type ExampleBlock } from './checkExamples.ts'

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

	it('accepts a closing fence that is longer than the opening fence', () => {
		const markdown = '```typescript\nconst a: number = "x"\n````\n\n```ts\nconst b = 2\n```\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [
			{ file: 'f.md', line: 1, code: 'const a: number = "x"\n' },
			{ file: 'f.md', line: 5, code: 'const b = 2\n' },
		])
	})

	it('does not close a block with a shorter fence', () => {
		const markdown = '````typescript\n```\nconst a = 1\n```\n````\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [{ file: 'f.md', line: 1, code: '```\nconst a = 1\n```\n' }])
	})

	it('returns a block that the document ends without closing', () => {
		const markdown = 'text\n\n```typescript\nconst a = 1\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [{ file: 'f.md', line: 3, code: 'const a = 1\n' }])
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

describe('example blocks', () => {
	it('every block in the READMEs and guides typechecks on its own', () => {
		const diagnostics = checkExamples(readExampleBlocks(repoRoot), repoRoot)
		const report = [
			`${diagnostics.length} example block errors. Run \`npm run build\` first when the errors are TS2307.`,
			...diagnostics.map(formatDiagnostic),
		].join('\n')
		equal(diagnostics.length, 0, report)
	})
})

describe('parseExampleContext', () => {
	it('returns each statement with its line and the names it declares', () => {
		const text = "declare const reporter: import('@svta/cml-cmcd').CmcdReporter\n\ntype Panel = { append(): void }\ndeclare function startPlayer(): void\n"
		const statements = parseExampleContext(text, 'libs/x/docs/guide.context.d.ts')
		deepEqual(statements.map(statement => [statement.line, statement.names]), [[1, ['reporter']], [3, ['Panel']], [4, ['startPlayer']]])
		equal(statements[0].text, "declare const reporter: import('@svta/cml-cmcd').CmcdReporter")
	})
})

describe('checkExamples with a context', () => {
	const context = parseExampleContext("declare const reporter: import('@svta/cml-cmcd').CmcdReporter\ndeclare function startPlayer(): void\n", 'libs/x/docs/guide.context.d.ts')

	it('prepends the context statements to a block that does not declare the names', () => {
		const block: ExampleBlock = { file: 'libs/x/docs/guide.md', line: 1, code: 'reporter.update({ bl: [3000] });\nstartPlayer();\n', context }
		deepEqual(checkExamples([block], repoRoot), [])
	})

	it('skips a context statement when the block declares the name', () => {
		const code = 'import { CmcdReporter } from "@svta/cml-cmcd";\nconst reporter = new CmcdReporter({ cid: "a" });\nreporter.update({ bl: [3000] });\n'
		deepEqual(checkExamples([{ file: 'libs/x/docs/guide.md', line: 1, code, context }], repoRoot), [])
	})

	it('reports a block error at the markdown line', () => {
		const block: ExampleBlock = { file: 'libs/x/docs/guide.md', line: 5, code: 'startPlayer();\nreporter.update({ bl: "a" });\n', context }
		const diagnostics = checkExamples([block], repoRoot)
		equal(diagnostics.length, 1)
		equal(diagnostics[0].code, 2322)
		equal(diagnostics[0].file, 'libs/x/docs/guide.md')
		equal(diagnostics[0].line, 7)
	})

	it('reports a context error in the context file', () => {
		const broken = parseExampleContext('declare function startPlayer(): void\ndeclare const reporter: Missing\n', 'libs/x/docs/guide.context.d.ts')
		const diagnostics = checkExamples([{ file: 'libs/x/docs/guide.md', line: 1, code: 'console.log(reporter);\n', context: broken }], repoRoot)
		equal(diagnostics.length, 1)
		equal(diagnostics[0].code, 2304)
		equal(diagnostics[0].file, 'libs/x/docs/guide.context.d.ts')
		equal(diagnostics[0].line, 2)
	})
})
