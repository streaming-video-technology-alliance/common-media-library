import type { BmffHashConstraint, BmffHashExclusion } from './BmffHashExclusion.ts'
import { asUnsignedInteger, toUint8Array } from '../utils.ts'

function isMap(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// data-map CDDL: a uint offset and a byte string value
function parseConstraints(rawConstraints: unknown): BmffHashConstraint[] | null {
	if (!Array.isArray(rawConstraints)) return null

	const constraints: BmffHashConstraint[] = []
	for (const rawConstraint of rawConstraints) {
		if (!isMap(rawConstraint)) return null
		const offset = asUnsignedInteger(rawConstraint['offset'])
		const value = toUint8Array(rawConstraint['value'])
		if (offset === null || !value) return null
		constraints.push({ offset, value })
	}
	return constraints
}

/**
 * Parses the `exclusions` array of a `c2pa.hash.bmff.v3` assertion (C2PA section 18.6).
 *
 * @param rawExclusions - The decoded `exclusions` field
 * @returns The exclusions, an empty array for an absent field, or `null` if the field does not conform
 *
 * @internal
 */
export function parseExclusions(rawExclusions: unknown): BmffHashExclusion[] | null {
	// c2pa-rs encodes an absent optional field as CBOR null
	if (rawExclusions == null) return []
	if (!Array.isArray(rawExclusions)) return null

	const exclusions: BmffHashExclusion[] = []
	for (const rawExclusion of rawExclusions) {
		if (!isMap(rawExclusion) || typeof rawExclusion['xpath'] !== 'string') return null
		const xpath = rawExclusion['xpath']
		if (rawExclusion['data'] == null) {
			exclusions.push({ xpath })
			continue
		}
		const constraints = parseConstraints(rawExclusion['data'])
		if (!constraints) return null
		exclusions.push(constraints.length > 0 ? { xpath, data: constraints } : { xpath })
	}
	return exclusions
}
