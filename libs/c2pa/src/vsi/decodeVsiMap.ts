import { decodeCbor } from '../cbor/readCborItem.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import { asUnsignedInteger, normalizeAlgorithmName } from '../utils.ts'
import type { VsiMap } from './VsiMap.ts'


/**
 * Decodes a C2PA Verifiable Segment Info (VSI) CBOR map from raw bytes.
 *
 * Normalizes hash algorithm names to WebCrypto format (e.g. `sha256` → `SHA-256`).
 *
 * @param vsiCborBytes - Raw CBOR-encoded VSI map bytes from the EMSG `messageData`
 * @returns The decoded VSI map
 * @throws If the bytes are not a valid VSI CBOR map
 *
 * @example
 * {@includeCode ../../test/vsi/decodeVsiMap.test.ts#example}
 *
 * @internal
 */
export function decodeVsiMap(vsiCborBytes: Uint8Array): VsiMap {
	const raw = decodeCbor(vsiCborBytes) as Record<string, unknown>

	if (typeof raw !== 'object' || raw === null) {
		throw new Error('VSI map must be a CBOR map')
	}

	const rawSequenceNumber = raw['sequenceNumber']
	const sequenceNumber = asUnsignedInteger(rawSequenceNumber)
	if (sequenceNumber === null) {
		const received = typeof rawSequenceNumber === 'number' || typeof rawSequenceNumber === 'bigint' ? String(rawSequenceNumber) : typeof rawSequenceNumber
		throw new Error(`VSI map sequenceNumber must be an unsigned integer up to ${Number.MAX_SAFE_INTEGER}, got ${received}`)
	}

	const bmffHashRaw = raw['bmffHash'] as Record<string, unknown> | undefined
	if (!bmffHashRaw || typeof bmffHashRaw !== 'object') throw new Error('VSI map missing bmffHash')

	const hash = bmffHashRaw['hash']
	if (!(hash instanceof Uint8Array)) throw new Error('VSI map bmffHash.hash must be a Uint8Array')

	const exclusions = parseExclusions(bmffHashRaw['exclusions'])
	if (!exclusions) throw new Error('VSI map bmffHash.exclusions must be an array of maps with an xpath text string, and data constraints with an unsigned integer offset and a byte string value')

	const manifestId = raw['manifestId']
	if (typeof manifestId !== 'string') throw new Error('VSI map missing or invalid manifestId')

	const alg = normalizeAlgorithmName(bmffHashRaw['alg'] as string | undefined)

	return {
		sequenceNumber,
		bmffHash: {
			hash,
			alg,
			exclusions,
		},
		manifestId,
	}
}
