import type { IsoBoxReadView, ParsedIsoBox } from '@svta/cml-iso-bmff'

const MILLISECONDS_PER_SECOND = 1000
const SHA_ALGORITHM_PATTERN = /^sha(\d+)$/i

/**
 * Normalizes hash algorithm names to WebCrypto format (e.g. `sha256` → `SHA-256`).
 *
 * @internal
 */
export function normalizeAlgorithmName(rawAlg: string): string {
	return rawAlg.replace(SHA_ALGORITHM_PATTERN, 'SHA-$1')
}

/**
 * Converts a Uint8Array to a lowercase hex string.
 *
 * @internal
 */
export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Checks whether a session key has expired based on its creation time
 * and validity period.
 *
 * @param createdAt - ISO 8601 date string when the key was created
 * @param validityPeriodSeconds - Validity duration in seconds
 * @param now - Current time (defaults to `new Date()`, injectable for testing)
 * @returns `true` if the key has expired
 *
 * @internal
 */
export function isKeyExpired(createdAt: string, validityPeriodSeconds: number, now: Date = new Date()): boolean {
	const createdAtMs = new Date(createdAt).getTime()
	if (Number.isNaN(createdAtMs)) return true
	const validityEnd = new Date(createdAtMs + validityPeriodSeconds * MILLISECONDS_PER_SECOND)
	return now > validityEnd
}

// C2PA manifest store UUID per C2PA specification
const C2PA_MANIFEST_UUID: readonly number[] = [
	0xd8, 0xfe, 0xc3, 0xd6, 0x1a, 0x96, 0x4f, 0x32,
	0xa0, 0xf6, 0xf3, 0xec, 0xf9, 0x6c, 0x10, 0xea,
]

// JUMBF UUID per ISO 19566-5 (used by c2pa-rs and other JUMBF-compliant tools)
const JUMBF_UUID: readonly number[] = [
	0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c,
	0x92, 0x97, 0x58, 0x28, 0x87, 0x7e, 0xc4, 0x81,
]

function matchesUuid(usertype: readonly number[], expected: readonly number[]): boolean {
	return usertype.length === expected.length && expected.every((b, i) => b === usertype[i])
}

function isC2paUuid(usertype: readonly number[]): boolean {
	return matchesUuid(usertype, C2PA_MANIFEST_UUID) || matchesUuid(usertype, JUMBF_UUID)
}

/**
 * A parsed ISO BMFF box with a UUID type.
 *
 * `ParsedIsoBox` does not include 'uuid' in its type union because UUID boxes
 * are not part of the standard `IsoBoxMap`. This type represents the structural
 * shape needed to work with UUID boxes at runtime.
 *
 * @internal
 */
export type UuidParsedBox = {
	type: string
	usertype?: number[]
	view: IsoBoxReadView
	size: number
}

/**
 * Finds the C2PA UUID box in a list of parsed ISO BMFF boxes.
 *
 * Matches against both the C2PA manifest store UUID and the JUMBF UUID
 * (ISO 19566-5), as different tools use different UUIDs.
 *
 * @internal
 */
export function findC2paUuidBox(boxes: ParsedIsoBox[]): UuidParsedBox | undefined {
	return (boxes as UuidParsedBox[]).find(
		box => box.type === 'uuid' && isC2paUuid(box.usertype ?? []),
	)
}

const FULLBOX_HEADER_SIZE = 4
const AUX_UUID_OFFSET_SIZE = 8

/**
 * Strips the JUMBF UUID box prefix (fullbox header, purpose string, aux offset)
 * to return only the JUMBF manifest data.
 *
 * Structure per ISO 19566-5 / C2PA BMFF storage:
 *   version(1) + flags(3) + purpose(null-terminated) + aux_offset(8) + JUMBF data
 *
 * Returns `null` if the payload does not contain a valid JUMBF UUID prefix.
 *
 * @internal
 */
export function stripJumbfUuidPrefix(payload: Uint8Array): Uint8Array | null {
	if (payload.length < FULLBOX_HEADER_SIZE) return null

	let offset = FULLBOX_HEADER_SIZE
	// Skip null-terminated purpose string (e.g. "manifest\0")
	while (offset < payload.length && payload[offset] !== 0) offset++
	if (offset >= payload.length) return null
	offset++ // skip the null terminator
	offset += AUX_UUID_OFFSET_SIZE
	if (offset > payload.length) return null
	return payload.subarray(offset)
}
