import { verifyCoseSign1 } from '../cose/verifyCoseSign1.ts'
import { decodeCoseSign1 } from '../cose/decodeCoseSign1.ts'
import { extractVsiEmsgBox } from '../emsg/extractVsiEmsgBox.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { decodeVsiMap } from '../vsi/decodeVsiMap.ts'
import type { SequenceState } from '../vsi/SequenceState.ts'
import { createSequenceState } from '../vsi/createSequenceState.ts'
import { validateSequenceNumber } from '../vsi/validateSequenceNumber.ts'
import { validateBmffHash } from '../bmff/validateBmffHash.ts'
import type { ValidatedSessionKey } from '../init/InitSegmentValidation.ts'
import { resolveImportAlgorithm } from '../cose/resolveImportAlgorithm.ts'
import { bytesToHex, isKeyExpired } from '../utils.ts'
import type { SegmentValidationResult } from './SegmentValidation.ts'

function findSessionKey(sessionKeys: readonly ValidatedSessionKey[], kidHex: string | null): ValidatedSessionKey | null {
	if (!kidHex || sessionKeys.length === 0) return null
	return sessionKeys.find(k => k.kid === kidHex) ?? null
}

/**
 * Validates a C2PA live stream segment using the VSI/EMSG method (§19.7.3).
 *
 * Extracts the EMSG box, decodes the COSE_Sign1 and VSI map, matches the
 * session key by kid, then performs all cryptographic checks: signature
 * verification, BMFF content hash, sequence number floor, and key validity.
 *
 * Returns `null` if the segment does not contain a C2PA EMSG box.
 *
 * @param segmentBytes - Raw segment bytes
 * @param sessionKeys - Available session keys from the init segment
 * @param sequenceState - Current sequence state for this stream
 * @returns Validation result and updated sequence state, or `null` if no C2PA EMSG box
 *
 * @example
 * {@includeCode ../../test/segment/validateC2paSegment.test.ts#example}
 *
 * @public
 */
export async function validateC2paSegment(
	segmentBytes: Uint8Array,
	sessionKeys: readonly ValidatedSessionKey[],
	sequenceState: SequenceState = createSequenceState(),
): Promise<{ readonly result: SegmentValidationResult; readonly nextSequenceState: SequenceState } | null> {
	const emsgBox = extractVsiEmsgBox(segmentBytes)
	if (!emsgBox) return null

	const coseSign1 = decodeCoseSign1(emsgBox.messageData)
	const vsi = decodeVsiMap(coseSign1.payload)

	const kidHex = coseSign1.kid ? bytesToHex(coseSign1.kid) : null
	const sessionKey = findSessionKey(sessionKeys, kidHex)
	const bmffHashHex = bytesToHex(vsi.bmffHash.hash)
	const minSequenceNumber = sessionKey?.minSequenceNumber ?? 0

	const { result: sequenceResult, nextState: nextSequenceState } = validateSequenceNumber(
		sequenceState,
		vsi.sequenceNumber,
		minSequenceNumber,
	)

	const baseFields = {
		sequenceNumber: vsi.sequenceNumber,
		manifestId: vsi.manifestId,
		bmffHashHex,
		kidHex,
		sequenceResult,
	}

	if (!sessionKey) {
		return {
			result: {
				...baseFields,
				isValid: false,
				errorCodes: [LiveVideoStatusCode.SEGMENT_INVALID],
			},
			nextSequenceState,
		}
	}

	const algorithm = resolveImportAlgorithm(sessionKey.jwk)
	const publicKey = await crypto.subtle.importKey(
		'jwk',
		sessionKey.jwk as JsonWebKey,
		algorithm,
		false,
		['verify'],
	)

	const [signatureValid, hashValid] = await Promise.all([
		verifyCoseSign1(coseSign1, coseSign1.payload, publicKey),
		validateBmffHash(segmentBytes, vsi.bmffHash.hash, {
			exclusions: vsi.bmffHash.exclusions,
			alg: vsi.bmffHash.alg,
		}),
	])

	const sequenceAboveMin = vsi.sequenceNumber >= sessionKey.minSequenceNumber
	// §19.7.3 requires comparing against the segment's presentation time, but the
	// VSI map does not carry it. We compare against `now` as an approximation,
	// which is accurate for live streams validated in real time.
	const keyExpired = isKeyExpired(sessionKey.createdAt, sessionKey.validityPeriod)

	const codes = new Set<LiveVideoStatusCode>()
	if (!signatureValid || !hashValid || !sequenceAboveMin) codes.add(LiveVideoStatusCode.SEGMENT_INVALID)
	if (keyExpired) codes.add(LiveVideoStatusCode.SESSIONKEY_INVALID)
	const errorCodes = [...codes]

	return {
		result: { ...baseFields, isValid: errorCodes.length === 0, errorCodes },
		nextSequenceState,
	}
}
