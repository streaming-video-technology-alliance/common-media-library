import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/** One statement of a context file, with the names it declares. */
export type ContextStatement = {
	/** Repo-relative path of the context file. */
	file: string
	/** 1-based line of the statement in the context file. */
	line: number
	/** The statement text, without leading comments. */
	text: string
	/** The names the statement declares. */
	names: string[]
}

/** One fenced TypeScript block of a markdown file. */
export type ExampleBlock = {
	/** Repo-relative path of the markdown file, with forward slashes. */
	file: string
	/** 1-based line of the opening fence. */
	line: number
	/** The code between the fences, with a trailing newline. */
	code: string
	/** The statements of the context file next to the markdown file. */
	context?: ContextStatement[]
}

/** One compiler error, located in the markdown file or in a context file. */
export type ExampleDiagnostic = {
	file: string
	/** 1-based line. 0 when the error has no location. */
	line: number
	/** The numeric TypeScript code, such as 2304. */
	code: number
	message: string
}

const openFence = /^(`{3,})(\S*)/
const closeFence = /^(`{3,})\s*$/
const exampleLanguages = new Set(['ts', 'typescript'])

/**
 * Returns the `ts` and `typescript` fenced blocks of `markdown`. Fences must start at column 0. A closing
 * fence has at least as many backticks as the opening fence. A block that the document ends without closing
 * runs to the end of the document.
 */
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

		const close = closeFence.exec(text)
		if (close && close[1].length >= fence.length) {
			if (exampleLanguages.has(language)) {
				blocks.push({ file, line: start + 1, code: `${code.join('\n')}\n` })
			}
			fence = ''
			continue
		}

		code.push(text)
	}

	if (fence !== '' && exampleLanguages.has(language)) {
		if (code.at(-1) === '') {
			code.pop()
		}
		blocks.push({ file, line: start + 1, code: `${code.join('\n')}\n` })
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

function bindingNames(name: ts.BindingName, names: string[]): void {
	if (ts.isIdentifier(name)) {
		names.push(name.text)
		return
	}

	for (const element of name.elements) {
		if (ts.isBindingElement(element)) {
			bindingNames(element.name, names)
		}
	}
}

/** The names that a top-level statement declares: variables, functions, classes, types, and imports. */
export function declaredNames(statement: ts.Statement): string[] {
	const names: string[] = []

	if (ts.isVariableStatement(statement)) {
		for (const declaration of statement.declarationList.declarations) {
			bindingNames(declaration.name, names)
		}
	} else if (
		ts.isFunctionDeclaration(statement) ||
		ts.isClassDeclaration(statement) ||
		ts.isTypeAliasDeclaration(statement) ||
		ts.isInterfaceDeclaration(statement) ||
		ts.isEnumDeclaration(statement) ||
		ts.isModuleDeclaration(statement)
	) {
		if (statement.name && ts.isIdentifier(statement.name)) {
			names.push(statement.name.text)
		}
	} else if (ts.isImportDeclaration(statement) && statement.importClause) {
		const clause = statement.importClause
		if (clause.name) {
			names.push(clause.name.text)
		}
		if (clause.namedBindings) {
			if (ts.isNamespaceImport(clause.namedBindings)) {
				names.push(clause.namedBindings.name.text)
			} else {
				for (const element of clause.namedBindings.elements) {
					names.push(element.name.text)
				}
			}
		}
	}

	return names
}

/** Splits a context file into statements. Comments between statements are dropped. */
export function parseExampleContext(text: string, file: string): ContextStatement[] {
	const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)

	return source.statements.map(statement => ({
		file,
		line: source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1,
		text: statement.getText(source),
		names: declaredNames(statement),
	}))
}

/** Reads the context file of a markdown file: the same path with `.context.d.ts` in place of `.md`. */
export function readExampleContext(repoRoot: string, file: string): ContextStatement[] {
	const contextFile = file.replace(/\.md$/, '.context.d.ts')
	const fullPath = path.join(repoRoot, contextFile)

	return existsSync(fullPath)
		? parseExampleContext(readFileSync(fullPath, 'utf8'), contextFile)
		: []
}

/** Reads every example block of the files that `listExampleFiles` returns, with the context of each file. */
export function readExampleBlocks(repoRoot: string): ExampleBlock[] {
	return listExampleFiles(repoRoot).flatMap(file => {
		const context = readExampleContext(repoRoot, file)
		const markdown = readFileSync(path.join(repoRoot, file), 'utf8')
		return extractExampleBlocks(markdown, file).map(block => ({ ...block, context }))
	})
}

/** The folder, under the repo root, that holds the virtual block modules. It does not exist on disk. */
const virtualFolder = '.example-check'

/** TypeScript passes forward-slash paths to the compiler host, also on Windows. */
function slash(file: string): string {
	return file.replace(/\\/g, '/')
}

type Header = {
	text: string
	/** Lines that the header adds before the block code. */
	lines: number
	/** Each prepended statement with its first line in the header. */
	statements: { start: number; statement: ContextStatement }[]
}

const emptyHeader: Header = { text: '', lines: 0, statements: [] }

/** The context statements that a block needs: every statement whose names the block does not declare itself. */
function contextHeader(block: ExampleBlock): Header {
	const context = block.context ?? []

	if (context.length === 0) {
		return emptyHeader
	}

	const source = ts.createSourceFile('block.ts', block.code, ts.ScriptTarget.Latest, true)
	const own = new Set(source.statements.flatMap(declaredNames))
	const statements: Header['statements'] = []
	const parts: string[] = []
	let lines = 0

	for (const statement of context) {
		if (statement.names.some(name => own.has(name))) {
			continue
		}
		statements.push({ start: lines, statement })
		parts.push(statement.text)
		lines += statement.text.split('\n').length
	}

	return parts.length === 0
		? emptyHeader
		: { text: `${parts.join('\n')}\n\n`, lines: lines + 1, statements }
}

/** The root tsconfig options, adjusted for a noEmit check of standalone blocks. */
export function exampleCompilerOptions(repoRoot: string): ts.CompilerOptions {
	const configPath = path.join(repoRoot, 'tsconfig.json')
	const config = ts.readConfigFile(configPath, ts.sys.readFile)

	if (config.error) {
		throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
	}

	const { options, errors } = ts.convertCompilerOptionsFromJson(
		config.config.compilerOptions,
		repoRoot,
	)

	if (errors.length > 0) {
		throw new Error(
			errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'),
		)
	}

	const {
		incremental,
		declaration,
		declarationMap,
		isolatedDeclarations,
		sourceMap,
		inlineSources,
		outDir,
		tsBuildInfoFile,
		...rest
	} = options

	return {
		...rest,
		noEmit: true,
		skipLibCheck: true,
		noUnusedLocals: false,
		noUnusedParameters: false,
		moduleDetection: ts.ModuleDetectionKind.Force,
	}
}

type Origin = { block: ExampleBlock; header: Header }

/** Typechecks every block as its own ES module. Package imports resolve to the built `dist/` folders. */
export function checkExamples(blocks: ExampleBlock[], repoRoot: string): ExampleDiagnostic[] {
	const options = exampleCompilerOptions(repoRoot)
	const base = slash(path.join(repoRoot, virtualFolder))
	const virtual = new Map<string, string>()
	const origin = new Map<string, Origin>()

	virtual.set(`${base}/package.json`, '{"type":"module"}')

	blocks.forEach((block, index) => {
		const name = `${base}/${block.file}.${index}.ts`
		const header = contextHeader(block)
		virtual.set(name, header.text + block.code)
		origin.set(name, { block, header })
	})

	const host = ts.createCompilerHost(options)
	const { fileExists, readFile, getSourceFile } = host

	host.fileExists = file => virtual.has(slash(file)) || fileExists.call(host, file)
	host.readFile = file => virtual.get(slash(file)) ?? readFile.call(host, file)
	host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
		const code = virtual.get(slash(file))
		return code === undefined
			? getSourceFile.call(host, file, languageVersion, onError, shouldCreateNewSourceFile)
			: ts.createSourceFile(file, code, languageVersion, true)
	}

	const program = ts.createProgram([...origin.keys()], options, host)

	return ts.getPreEmitDiagnostics(program).map(diagnostic => locate(diagnostic, origin))
}

function locate(diagnostic: ts.Diagnostic, origin: Map<string, Origin>): ExampleDiagnostic {
	const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
	const found = diagnostic.file ? origin.get(slash(diagnostic.file.fileName)) : undefined

	if (!diagnostic.file || !found || diagnostic.start === undefined) {
		return { file: diagnostic.file?.fileName ?? '', line: 0, code: diagnostic.code, message }
	}

	const { block, header } = found
	const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

	if (line < header.lines) {
		const entry =
			header.statements.findLast(candidate => candidate.start <= line) ?? header.statements[0]
		return {
			file: entry.statement.file,
			line: entry.statement.line + (line - entry.start),
			code: diagnostic.code,
			message,
		}
	}

	return {
		file: block.file,
		line: block.line + 1 + (line - header.lines),
		code: diagnostic.code,
		message,
	}
}

/** `file:line TScode: message`, one line. */
export function formatDiagnostic(diagnostic: ExampleDiagnostic): string {
	return `${diagnostic.file}:${diagnostic.line} TS${diagnostic.code}: ${diagnostic.message}`
}
