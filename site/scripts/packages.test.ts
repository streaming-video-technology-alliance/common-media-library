import { deepEqual, equal, throws } from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { loadPackage, renderPackageIndex, type PackageInfo } from './packages.ts'

function fixture(folder: string, guides: Record<string, string> = {}): string {
	const libs = mkdtempSync(path.join(tmpdir(), 'cml-site-'))
	const dir = path.join(libs, folder)
	mkdirSync(dir, { recursive: true })
	writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: `@svta/cml-${folder}`, version: '1.2.3', description: 'Does things' }))

	for (const [file, title] of Object.entries(guides)) {
		mkdirSync(path.join(dir, 'docs'), { recursive: true })
		writeFileSync(path.join(dir, 'docs', file), `---\ntitle: ${title}\n---\n\n# ${title}\n`)
	}

	return libs
}

describe('loadPackage', () => {
	it('reads the manifest and the guide titles in file order', () => {
		const libs = fixture('cmcd', { 'user-guide.md': 'User Guide', 'validation-guide.md': 'Validation Guide' })
		deepEqual(loadPackage(libs, 'cmcd'), {
			folder: 'cmcd',
			name: '@svta/cml-cmcd',
			version: '1.2.3',
			description: 'Does things',
			group: 'Delivery',
			guides: [
				{ slug: 'user-guide', title: 'User Guide' },
				{ slug: 'validation-guide', title: 'Validation Guide' },
			],
		})
	})

	it('returns no guides when the docs folder is missing', () => {
		deepEqual(loadPackage(fixture('utils'), 'utils').guides, [])
	})

	it('fails for a package without a group', () => {
		throws(() => loadPackage(fixture('unknown'), 'unknown'), /no group for "unknown"/)
	})
})

describe('renderPackageIndex', () => {
	it('renders one section per group in group order', () => {
		const packages: PackageInfo[] = [
			{ folder: 'utils', name: '@svta/cml-utils', version: '1.0.0', description: 'Utilities', group: 'Core', guides: [] },
			{ folder: 'cmcd', name: '@svta/cml-cmcd', version: '2.0.0', description: 'CMCD', group: 'Delivery', guides: [] },
		]
		const text = renderPackageIndex(packages)
		equal(text.indexOf('## Delivery') < text.indexOf('## Core'), true)
		equal(text.includes('| [@svta/cml-cmcd](/packages/cmcd/) | 2.0.0 | CMCD |'), true)
		equal(text.includes('## Captions'), false)
	})
})
