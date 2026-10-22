import { deepEqual, ok } from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { extractExampleBlocks, listExampleFiles } from './checkExamples.ts'

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
