import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

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

/** One compiler error, located in the markdown file. */
export type ExampleDiagnostic = {
	file: string;
	/** 1-based markdown line. 0 when the error has no location. */
	line: number;
	/** The numeric TypeScript code, such as 2304. */
	code: number;
	message: string;
};

/** The folder, under the repo root, that holds the virtual block modules. It does not exist on disk. */
const virtualFolder = '.example-check'

/** The root tsconfig options, adjusted for a noEmit check of standalone blocks. */
export function exampleCompilerOptions(repoRoot: string): ts.CompilerOptions {
	const configPath = path.join(repoRoot, 'tsconfig.json')
	const config = ts.readConfigFile(configPath, ts.sys.readFile)

	if (config.error) {
		throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
	}

	const { options, errors } = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, repoRoot)

	if (errors.length > 0) {
		throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'))
	}

	const { incremental, declaration, declarationMap, isolatedDeclarations, sourceMap, inlineSources, outDir, tsBuildInfoFile, ...rest } = options

	return {
		...rest,
		noEmit: true,
		skipLibCheck: true,
		noUnusedLocals: false,
		noUnusedParameters: false,
		moduleDetection: ts.ModuleDetectionKind.Force,
	}
}

/** Typechecks every block as its own ES module. Package imports resolve to the built `dist/` folders. */
export function checkExamples(blocks: ExampleBlock[], repoRoot: string): ExampleDiagnostic[] {
	const options = exampleCompilerOptions(repoRoot)
	const base = path.join(repoRoot, virtualFolder)
	const virtual = new Map<string, string>()
	const origin = new Map<string, ExampleBlock>()

	virtual.set(path.join(base, 'package.json'), '{"type":"module"}')

	blocks.forEach((block, index) => {
		const name = path.join(base, `${block.file}.${index}.ts`)
		virtual.set(name, block.code)
		origin.set(name, block)
	})

	const host = ts.createCompilerHost(options)
	const { fileExists, readFile, getSourceFile } = host

	host.fileExists = file => virtual.has(file) || fileExists.call(host, file)
	host.readFile = file => virtual.get(file) ?? readFile.call(host, file)
	host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
		const code = virtual.get(file)
		return code === undefined
			? getSourceFile.call(host, file, languageVersion, onError, shouldCreateNewSourceFile)
			: ts.createSourceFile(file, code, languageVersion, true)
	}

	const program = ts.createProgram([...origin.keys()], options, host)

	return ts.getPreEmitDiagnostics(program).map(diagnostic => locate(diagnostic, origin))
}

function locate(diagnostic: ts.Diagnostic, origin: Map<string, ExampleBlock>): ExampleDiagnostic {
	const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
	const block = diagnostic.file ? origin.get(diagnostic.file.fileName) : undefined

	if (!diagnostic.file || !block || diagnostic.start === undefined) {
		return { file: diagnostic.file?.fileName ?? '', line: 0, code: diagnostic.code, message }
	}

	const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

	return { file: block.file, line: block.line + 1 + line, code: diagnostic.code, message }
}

/** `file:line TScode: message`, one line. */
export function formatDiagnostic(diagnostic: ExampleDiagnostic): string {
	return `${diagnostic.file}:${diagnostic.line} TS${diagnostic.code}: ${diagnostic.message}`
}
