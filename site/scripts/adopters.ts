import { readFileSync } from 'node:fs'

export type Adopter = {
	name: string;
	url: string;
	packages: string[];
	note?: string;
}

function fail(index: number, message: string): never {
	throw new Error(`adopters.json entry ${index + 1}: ${message}`)
}

// Reads the hand-maintained adopters list and checks every field. The build fails on a bad entry.
export function loadAdopters(file: string, folders: Set<string>): Adopter[] {
	const data: unknown = JSON.parse(readFileSync(file, 'utf8'))

	if (!Array.isArray(data)) {
		throw new Error('adopters.json must be an array')
	}

	return data.map((entry: Record<string, unknown>, index) => {
		const { name, url, packages, note } = entry

		if (typeof name !== 'string' || name === '') {
			fail(index, 'name must be a non-empty string')
		}

		if (typeof url !== 'string' || !url.startsWith('https://')) {
			fail(index, 'url must start with https://')
		}

		if (!Array.isArray(packages) || packages.some(pkg => typeof pkg !== 'string')) {
			fail(index, 'packages must be an array of strings')
		}

		for (const pkg of packages as string[]) {
			if (!folders.has(pkg)) {
				fail(index, `unknown package "${pkg}". Use a folder name from libs/.`)
			}
		}

		if (note !== undefined && typeof note !== 'string') {
			fail(index, 'note must be a string')
		}

		return note === undefined ? { name, url, packages } :{ name, url, packages, note }
	})
}
