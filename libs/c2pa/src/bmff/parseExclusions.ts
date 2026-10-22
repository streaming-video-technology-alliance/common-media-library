import type { BmffHashConstraint, BmffHashExclusion, BmffHashSubset } from './BmffHashExclusion.ts'
import { parseXpath } from './findExcludedRanges.ts'
import { asUnsignedInteger, toUint8Array } from '../utils.ts'

const MAX_VERSION = 0xff
const FLAGS_SIZE = 3

type MutableExclusion = { -readonly [K in keyof BmffHashExclusion]: BmffHashExclusion[K] }

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

// subset-map CDDL: one or more entries with a uint offset and length. §18.6.2: the offsets increase,
// the ranges do not overlap, and only the last entry may have a length of 0.
function parseSubset(rawSubset: unknown): BmffHashSubset[] | null {
	if (!Array.isArray(rawSubset) || rawSubset.length === 0) return null

	const subset: BmffHashSubset[] = []
	let nextOffset = 0
	for (let i = 0; i < rawSubset.length; i++) {
		const rawEntry = rawSubset[i]
		if (!isMap(rawEntry)) return null
		const offset = asUnsignedInteger(rawEntry['offset'])
		const length = asUnsignedInteger(rawEntry['length'])
		if (offset === null || length === null) return null
		if (offset < nextOffset || (length === 0 && i < rawSubset.length - 1)) return null
		nextOffset = offset + length
		subset.push({ offset, length })
	}
	return subset
}

function parseExclusion(raw: Record<string, unknown>): BmffHashExclusion | null {
	const xpath = raw['xpath']
	if (typeof xpath !== 'string' || !parseXpath(xpath)) return null
	const exclusion: MutableExclusion = { xpath }

	if (raw['length'] != null) {
		const length = asUnsignedInteger(raw['length'])
		if (length === null) return null
		exclusion.length = length
	}
	if (raw['data'] != null) {
		const constraints = parseConstraints(raw['data'])
		if (!constraints) return null
		if (constraints.length > 0) exclusion.data = constraints
	}
	if (raw['subset'] != null) {
		const subset = parseSubset(raw['subset'])
		if (!subset) return null
		exclusion.subset = subset
	}
	if (raw['version'] != null) {
		const version = asUnsignedInteger(raw['version'])
		if (version === null || version > MAX_VERSION) return null
		exclusion.version = version
	}
	if (raw['flags'] != null) {
		const flags = toUint8Array(raw['flags'])
		if (!flags || flags.length !== FLAGS_SIZE) return null
		exclusion.flags = flags
	}
	if (raw['exact'] != null) {
		if (typeof raw['exact'] !== 'boolean') return null
		// The CDDL allows exact only with flags
		if (exclusion.flags) exclusion.exact = raw['exact']
	}
	return exclusion
}

/**
 * Parses the `exclusions` array of a `c2pa.hash.bmff.v3` assertion (C2PA section 18.6).
 *
 * An exclusion conforms when its `xpath` follows the grammar of section 18.6.2 and each present
 * field of the `exclusions-map` has the CDDL type: a uint `length`, `data` constraints with a uint
 * `offset` and a byte string `value`, a `subset` of entries with a uint `offset` and `length`,
 * a `version` of 0 to 255, `flags` of 3 bytes, and a boolean `exact`.
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
		if (!isMap(rawExclusion)) return null
		const exclusion = parseExclusion(rawExclusion)
		if (!exclusion) return null
		exclusions.push(exclusion)
	}
	return exclusions
}
