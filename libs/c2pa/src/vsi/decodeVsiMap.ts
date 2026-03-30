import { decode } from 'cbor-x'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import type { VsiMap } from './VsiMap.ts'

const SHA_ALGORITHM_PATTERN = /^sha(\d+)$/i
const DEFAULT_HASH_ALG = 'sha256'

function normalizeAlgorithmName(rawAlg: string): string {
	return rawAlg.replace(SHA_ALGORITHM_PATTERN, 'SHA-$1')
}

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
 * @public
 */
export function decodeVsiMap(vsiCborBytes: Uint8Array): VsiMap {
	const raw = decode(vsiCborBytes) as Record<string, unknown>

	if (typeof raw !== 'object' || raw === null) {
		throw new Error('VSI map must be a CBOR map')
	}

	const sequenceNumber = raw['sequenceNumber']
	if (sequenceNumber === undefined) throw new Error('VSI map missing sequenceNumber')

	const bmffHashRaw = raw['bmffHash'] as Record<string, unknown> | undefined
	if (!bmffHashRaw || typeof bmffHashRaw !== 'object') throw new Error('VSI map missing bmffHash')

	const manifestId = raw['manifestId']
	if (!manifestId) throw new Error('VSI map missing manifestId')

	const alg = normalizeAlgorithmName((bmffHashRaw['alg'] as string | undefined) ?? DEFAULT_HASH_ALG)
	const exclusions = (bmffHashRaw['exclusions'] as BmffHashExclusion[] | undefined) ?? []

	return {
		sequenceNumber: Number(sequenceNumber),
		bmffHash: {
			hash: bmffHashRaw['hash'] as Uint8Array,
			alg,
			exclusions,
		},
		manifestId: manifestId as Uint8Array,
	}
}
