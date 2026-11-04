import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, stripVTControlCharacters } from 'node:util'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { build } from 'vite-plus'
import { isOverBudget, isRecord, parseBudget, type Entry } from './sizeBudget.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

type Row = {
	name: string
	minified: number
	gzip: number
	brotli: number
	budget: number
	over: boolean
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
	typeOnlyPeers: string[],
	tmp: string,
	id: string,
): Promise<Omit<Row, 'budget' | 'over'>> {
	const dist = path.join(root, 'libs', pkg, 'dist', 'index.js')
	const names = entry.imports.join(', ')
	const input = path.join(tmp, `${id}.entry.js`)
	const source =
		entry.imports.length === 0
			? `import ${JSON.stringify(dist)}\n`
			: `import { ${names} } from ${JSON.stringify(dist)}\nglobalThis.__cmlSize = [${names}]\n`

	await writeFile(input, source)

	let code: string
	try {
		const result = await build({
			configFile: false,
			logLevel: 'silent',
			build: {
				lib: { entry: input, formats: ['es'], fileName: 'bundle' },
				minify: true,
				write: false,
				target: 'esnext',
				rolldownOptions: {
					external: peers,
					treeshake: { moduleSideEffects: 'no-external' },
					output: { minify: { codegen: true } },
				},
			},
		})
		const first = Array.isArray(result) ? result[0] : result
		if (first === undefined || !('output' in first) || first.output.length === 0) {
			throw new Error('The build returned no output chunk.')
		}
		code = first.output[0].code
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error)
		throw new Error(
			`Bundling the entry "${name}" of ${pkg} failed.\n${stripVTControlCharacters(detail)}`,
		)
	}

	const peer = typeOnlyPeers.find(peer => code.includes(peer))
	if (peer !== undefined) {
		throw new Error(
			`The entry "${name}" of ${pkg} imports the peer dependency ${peer} at runtime. The size budget of ${pkg} lists ${peer} in "typeOnlyPeers".`,
		)
	}

	const bytes = Buffer.from(code)

	return {
		name,
		minified: bytes.length,
		gzip: gzipSync(bytes, { level: 9 }).length,
		brotli: brotliCompressSync(bytes).length,
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
	const typeOnlyPeers =
		budget.typeOnlyPeers === true
			? peers
			: Array.isArray(budget.typeOnlyPeers)
				? budget.typeOnlyPeers
				: []
	const sizes = await Promise.all(
		Object.entries(budget.entries).map(([name, entry], i) => {
			return measure(pkg, name, entry, peers, typeOnlyPeers, tmp, `${pkg}-${i}`)
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
			over: isOverBudget(size.brotli, entry.brotli, budget.tolerance),
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
		const over: string[] = []
		for (const pkg of packages) {
			const rows = await sizePackage(pkg, tmp, values.update === true)
			over.push(...rows.filter(row => row.over).map(row => `${pkg} "${row.name}"`))
		}

		if (values.check && over.length > 0) {
			throw new Error(
				`Size check failed. Over budget plus the tolerance: ${over.join(', ')}. If the growth is intended, raise the budget with: npm run size -- --update`,
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
