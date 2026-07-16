import type { BmffHashConstraint, BmffHashExclusion } from './BmffHashExclusion.ts'
import { toUint8Array } from '../utils.ts'

function parseConstraints(rawConstraints: unknown): BmffHashConstraint[] {
	if (!Array.isArray(rawConstraints)) return []

	const constraints: BmffHashConstraint[] = []
	for (const c of rawConstraints) {
		if (!c || typeof c !== 'object') continue
		const record = c as Record<string, unknown>
		if (typeof record['offset'] !== 'number') continue
		const value = toUint8Array(record['value'])
		if (value) constraints.push({ offset: record['offset'], value })
	}
	return constraints
}

/**
 * Parses the `exclusions` array of a `c2pa.hash.bmff.v3` assertion.
 *
 * @internal
 */
export function parseExclusions(rawExclusions: unknown): BmffHashExclusion[] {
	if (!Array.isArray(rawExclusions)) return []

	const exclusions: BmffHashExclusion[] = []
	for (const exc of rawExclusions) {
		if (!exc || typeof exc !== 'object') continue
		const record = exc as Record<string, unknown>
		if (typeof record['xpath'] !== 'string') continue

		const constraints = parseConstraints(record['data'])
		exclusions.push(constraints.length > 0 ? { xpath: record['xpath'], data: constraints } : { xpath: record['xpath'] })
	}
	return exclusions
}
