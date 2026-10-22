import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** One fenced TypeScript block of a markdown file. */
export type ExampleBlock = {
	/** Repo-relative path of the markdown file, with forward slashes. */
	file: string;
	/** 1-based line of the opening fence. */
	line: number;
	/** The code between the fences, with a trailing newline. */
	code: string;
};

const openFence = /^(`{3,})(\S*)/
const exampleLanguages = new Set(['ts', 'typescript'])

/** Returns the `ts` and `typescript` fenced blocks of `markdown`. Fences must start at column 0. */
export function extractExampleBlocks(markdown: string, file: string): ExampleBlock[] {
	const blocks: ExampleBlock[] = []
	const lines = markdown.split('\n')
	let fence = ''
	let language = ''
	let start = 0
	let code: string[] = []

	for (let i = 0; i < lines.length; i++) {
		const text = lines[i]

		if (fence === '') {
			const match = openFence.exec(text)
			if (match) {
				fence = match[1]
				language = match[2]
				start = i
				code = []
			}
			continue
		}

		if (text.trimEnd() === fence) {
			if (exampleLanguages.has(language)) {
				blocks.push({ file, line: start + 1, code: `${code.join('\n')}\n` })
			}
			fence = ''
			continue
		}

		code.push(text)
	}

	return blocks
}

/** Returns the repo-relative paths of the root README, every package README, and every package guide. */
export function listExampleFiles(repoRoot: string): string[] {
	const files = ['README.md']
	const libs = path.join(repoRoot, 'libs')

	for (const folder of readdirSync(libs).sort()) {
		const readme = path.posix.join('libs', folder, 'README.md')
		if (existsSync(path.join(repoRoot, readme))) {
			files.push(readme)
		}

		const docs = path.posix.join('libs', folder, 'docs')
		if (existsSync(path.join(repoRoot, docs))) {
			for (const name of readdirSync(path.join(repoRoot, docs)).sort()) {
				if (name.endsWith('.md')) {
					files.push(path.posix.join(docs, name))
				}
			}
		}
	}

	return files
}

/** Reads every example block of the files that `listExampleFiles` returns. */
export function readExampleBlocks(repoRoot: string): ExampleBlock[] {
	return listExampleFiles(repoRoot).flatMap(file => extractExampleBlocks(readFileSync(path.join(repoRoot, file), 'utf8'), file))
}
