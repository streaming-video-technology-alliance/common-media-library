import { execFile } from 'node:child_process'
import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, promisify } from 'node:util'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const execFileAsync = promisify(execFile)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rolldown = path.join(root, 'node_modules', '.bin', 'rolldown')

type Entry = {
	imports: string[]
	brotli: number
}

type Budget = {
	tolerance: number
	entries: Record<string, Entry>
}

type Row = {
	name: string
	minified: number
	gzip: number
	brotli: number
	budget: number
	over: boolean
}

function fail(file: string, field: string, expected: string, received: unknown): never {
	throw new Error(`${file}: "${field}" must be ${expected}. Received ${JSON.stringify(received)}.`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isExportName(value: unknown): value is string {
	return typeof value === 'string' && /^[A-Za-z_$][\w$]*$/.test(value)
}

function parseBudget(file: string, data: unknown): Budget {
	if (!isRecord(data)) {
		fail(file, '(file)', 'an object', data)
	}

	const { tolerance, entries } = data

	if (typeof tolerance !== 'number' || !Number.isFinite(tolerance) || tolerance < 0) {
		fail(file, 'tolerance', 'a number of at least 0', tolerance)
	}

	if (!isRecord(entries) || Object.keys(entries).length === 0) {
		fail(file, 'entries', 'an object with at least one entry', entries)
	}

	for (const [name, entry] of Object.entries(entries)) {
		if (!isRecord(entry)) {
			fail(file, `entries.${name}`, 'an object', entry)
		}

		const { imports, brotli } = entry

		if (!Array.isArray(imports) || imports.length === 0 || !imports.every(isExportName)) {
			fail(file, `entries.${name}.imports`, 'a non-empty array of export names', imports)
		}

		if (typeof brotli !== 'number' || !Number.isInteger(brotli) || brotli < 0) {
			fail(file, `entries.${name}.brotli`, 'an integer of at least 0', brotli)
		}
	}

	return data as Budget
}

async function exists(file: string): Promise<boolean> {
	return access(file).then(
		() => true,
		() => false,
	)
}

async function findBudgetPackages(): Promise<string[]> {
	const folders = await readdir(path.join(root, 'libs'))
	const found = await Promise.all(
		folders.map(async folder => {
			return (await exists(path.join(root, 'libs', folder, 'config', 'size-budget.json')))
				? folder
				: undefined
		}),
	)
	return found.filter((folder): folder is string => folder !== undefined).sort()
}

async function loadPeers(pkg: string): Promise<string[]> {
	const file = path.join(root, 'libs', pkg, 'package.json')
	const manifest: unknown = JSON.parse(await readFile(file, 'utf8'))
	const peerDependencies = isRecord(manifest) ? manifest['peerDependencies'] : undefined
	return isRecord(peerDependencies) ? Object.keys(peerDependencies) : []
}

async function measure(
	pkg: string,
	name: string,
	entry: Entry,
	peers: string[],
	tmp: string,
	id: string,
): Promise<Omit<Row, 'budget' | 'over'>> {
	const dist = path.join(root, 'libs', pkg, 'dist', 'index.js')
	const names = entry.imports.join(', ')
	const input = path.join(tmp, `${id}.entry.js`)
	const output = path.join(tmp, `${id}.out.js`)

	await writeFile(
		input,
		`import { ${names} } from ${JSON.stringify(dist)}\nglobalThis.__cmlSize = [${names}]\n`,
	)

	const args = [input, '--format', 'esm', '--minify', '--file', output]
	if (peers.length > 0) {
		args.push('--external', peers.join(','))
	}

	try {
		await execFileAsync(rolldown, args)
	} catch (error) {
		const { stdout, stderr } = error as { stdout?: string; stderr?: string }
		const detail = `${stdout ?? ''}${stderr ?? ''}`.trim()
		throw new Error(`Bundling the entry "${name}" of ${pkg} failed.\n${detail || String(error)}`)
	}

	const code = await readFile(output)
	return {
		name,
		minified: code.length,
		gzip: gzipSync(code, { level: 9 }).length,
		brotli: brotliCompressSync(code).length,
	}
}

function formatNumber(value: number): string {
	return value.toLocaleString('en-US')
}

function formatSigned(value: number): string {
	return value > 0 ? `+${formatNumber(value)}` : formatNumber(value)
}

function printTable(pkg: string, tolerance: number, rows: Row[]): void {
	const header = ['Entry', 'Minified', 'Gzip', 'Brotli', 'Budget', 'Headroom', 'Status']
	const body = rows.map(row => [
		row.name,
		formatNumber(row.minified),
		formatNumber(row.gzip),
		formatNumber(row.brotli),
		formatNumber(row.budget),
		formatSigned(row.budget - row.brotli),
		row.over ? 'OVER' : '',
	])
	const widths = header.map((title, i) =>
		Math.max(title.length, ...body.map(cells => cells[i].length)),
	)
	const last = header.length - 1
	const format = (cells: string[]): string =>
		cells
			.map((cell, i) => (i === 0 || i === last ? cell.padEnd(widths[i]) : cell.padStart(widths[i])))
			.join('  ')
			.trimEnd()

	console.log(`${pkg} (sizes in bytes, tolerance ${Number((tolerance * 100).toFixed(2))}%)`)
	console.log(format(header))
	console.log(widths.map(width => '-'.repeat(width)).join('  '))
	for (const cells of body) {
		console.log(format(cells))
	}
	console.log('')
}

async function sizePackage(pkg: string, tmp: string, update: boolean): Promise<Row[]> {
	const file = `libs/${pkg}/config/size-budget.json`
	const absolute = path.join(root, file)

	if (!(await exists(absolute))) {
		throw new Error(`${file} does not exist. Create the budget file for ${pkg}.`)
	}

	const text = await readFile(absolute, 'utf8')
	let data: unknown
	try {
		data = JSON.parse(text)
	} catch (error) {
		throw new Error(
			`${file}: is not valid JSON. ${error instanceof Error ? error.message : String(error)}`,
		)
	}

	const budget = parseBudget(file, data)

	if (!(await exists(path.join(root, 'libs', pkg, 'dist', 'index.js')))) {
		throw new Error(
			`libs/${pkg}/dist/index.js does not exist. Build the package with: npm run build -w libs/${pkg}`,
		)
	}

	const peers = await loadPeers(pkg)
	const sizes = await Promise.all(
		Object.entries(budget.entries).map(([name, entry], i) => {
			return measure(pkg, name, entry, peers, tmp, `${pkg}-${i}`)
		}),
	)

	const rows = sizes.map((size): Row => {
		const entry = budget.entries[size.name]
		if (update) {
			entry.brotli = size.brotli
		}
		return {
			...size,
			budget: entry.brotli,
			over: size.brotli > entry.brotli * (1 + budget.tolerance),
		}
	})

	if (update) {
		await writeFile(absolute, JSON.stringify(data, null, '\t') + '\n')
	}

	printTable(pkg, budget.tolerance, rows)

	if (update) {
		console.log(`Updated ${file}\n`)
	}

	return rows
}

async function main(): Promise<void> {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			check: { type: 'boolean' },
			update: { type: 'boolean' },
		},
	})

	if (values.check && values.update) {
		throw new Error('Use either --check or --update, not both.')
	}

	const packages = positionals.length > 0 ? positionals : await findBudgetPackages()

	if (packages.length === 0) {
		console.log('No package has a size budget in config/size-budget.json.')
		return
	}

	const tmp = await mkdtemp(path.join(tmpdir(), 'cml-size-'))
	try {
		let over = 0
		for (const pkg of packages) {
			const rows = await sizePackage(pkg, tmp, values.update === true)
			over += rows.filter(row => row.over).length
		}

		if (values.check && over > 0) {
			throw new Error(
				`Size check failed: ${over} ${over === 1 ? 'entry is' : 'entries are'} over budget plus the tolerance.`,
			)
		}
	} finally {
		await rm(tmp, { recursive: true, force: true })
	}
}

try {
	await main()
} catch (error) {
	console.error(error instanceof Error ? error.message : error)
	process.exitCode = 1
}
