export type Entry = {
	imports: string[]
	brotli: number
}

export type Budget = {
	tolerance: number
	typeOnlyPeers?: boolean | string[]
	entries: Record<string, Entry>
}

function fail(file: string, field: string, expected: string, received: unknown): never {
	throw new Error(`${file}: "${field}" must be ${expected}. Received ${JSON.stringify(received)}.`)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isExportName(value: unknown): value is string {
	return typeof value === 'string' && /^[A-Za-z_$][\w$]*$/.test(value)
}

/**
 * Checks the content of a size budget file.
 *
 * An entry with no imports measures a bare import of the package.
 *
 * @param file - The path of the file, for the error messages.
 * @param data - The parsed JSON of the file.
 * @returns The budget.
 * @throws Error when a field is missing or has the wrong type.
 */
export function parseBudget(file: string, data: unknown): Budget {
	if (!isRecord(data)) {
		fail(file, '(file)', 'an object', data)
	}

	const { tolerance, typeOnlyPeers, entries } = data

	if (typeof tolerance !== 'number' || !Number.isFinite(tolerance) || tolerance < 0) {
		fail(file, 'tolerance', 'a number of at least 0', tolerance)
	}

	if (
		typeOnlyPeers !== undefined &&
		typeof typeOnlyPeers !== 'boolean' &&
		!(Array.isArray(typeOnlyPeers) && typeOnlyPeers.every(peer => typeof peer === 'string'))
	) {
		fail(file, 'typeOnlyPeers', 'a boolean or an array of package names', typeOnlyPeers)
	}

	if (!isRecord(entries) || Object.keys(entries).length === 0) {
		fail(file, 'entries', 'an object with at least one entry', entries)
	}

	for (const [name, entry] of Object.entries(entries)) {
		if (!isRecord(entry)) {
			fail(file, `entries.${name}`, 'an object', entry)
		}

		const { imports, brotli } = entry

		if (!Array.isArray(imports) || !imports.every(isExportName)) {
			fail(file, `entries.${name}.imports`, 'an array of export names', imports)
		}

		if (typeof brotli !== 'number' || !Number.isInteger(brotli) || brotli < 0) {
			fail(file, `entries.${name}.brotli`, 'an integer of at least 0', brotli)
		}
	}

	return data as Budget
}

/**
 * Returns `true` when a size is over its budget plus the tolerance.
 *
 * @param size - The measured size in bytes.
 * @param budget - The budget in bytes.
 * @param tolerance - The tolerance as a fraction of the budget.
 */
export function isOverBudget(size: number, budget: number, tolerance: number): boolean {
	return size > budget * (1 + tolerance)
}
