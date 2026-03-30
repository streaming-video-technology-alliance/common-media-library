import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paManifestStore } from '../C2paManifest.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { bytesToHex } from '../utils.ts'
import type { ManifestBoxValidationResult, ManifestBoxValidationState } from './ManifestBoxValidation.ts'

const LIVE_VIDEO_ASSERTION_LABEL = 'c2pa.livevideo.segment'
const BMFF_HASH_ASSERTION_LABEL = 'c2pa.hash.bmff.v3'
const MANIFEST_ID_PREFIX_PATTERN = /^(xmp:iid:|urn:uuid:)/i
const CONTINUITY_METHOD_MANIFEST_ID = 'c2pa.manifestId'
const SUPPORTED_CONTINUITY_METHODS = new Set([CONTINUITY_METHOD_MANIFEST_ID])

function normalizeManifestId(id: string | null): string | null {
	if (!id) return null
	return id.replace(MANIFEST_ID_PREFIX_PATTERN, '').toLowerCase()
}

function extractAssertionData(data: unknown): Record<string, unknown> | null {
	if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
		return data as Record<string, unknown>
	}
	return null
}

type LiveVideoFields = {
	sequenceNumber: number | null
	previousManifestId: string | null
	streamId: string | null
	continuityMethod: string | null
}

function parseLiveVideoAssertion(assertions: readonly C2paAssertion[]): LiveVideoFields | null {
	const assertion = assertions.find(a => a.label === LIVE_VIDEO_ASSERTION_LABEL)
	if (!assertion) return null

	const data = extractAssertionData(assertion.data)
	const rawSeq = data?.['sequenceNumber']
	const rawPrev = data?.['previousManifestId']
	const rawStreamId = data?.['streamId']
	const rawContinuity = data?.['continuityMethod']

	return {
		sequenceNumber: typeof rawSeq === 'number' ? rawSeq : null,
		previousManifestId: typeof rawPrev === 'string' ? rawPrev : null,
		streamId: typeof rawStreamId === 'string' ? rawStreamId : null,
		continuityMethod: typeof rawContinuity === 'string' ? rawContinuity : null,
	}
}

function parseBmffHashHex(assertions: readonly C2paAssertion[]): string | null {
	const assertion = assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL)
	if (!assertion) return null

	const data = extractAssertionData(assertion.data)
	const rawHash = data?.['hash'] ?? data?.['value']
	if (rawHash instanceof Uint8Array) return bytesToHex(rawHash)
	if (Array.isArray(rawHash)) return bytesToHex(new Uint8Array(rawHash as number[]))
	return null
}

function parseManifest(bytes: Uint8Array): {
	manifest: C2paManifestStore | null
	issuer: string | null
	liveVideo: LiveVideoFields | null
	bmffHashHex: string | null
} {
	try {
		const manifest = readC2paManifest(bytes)
		const activeManifest = manifest?.activeManifest
		if (!activeManifest) return { manifest, issuer: null, liveVideo: null, bmffHashHex: null }

		return {
			manifest,
			issuer: activeManifest.signatureInfo?.issuer ?? null,
			liveVideo: parseLiveVideoAssertion(activeManifest.assertions),
			bmffHashHex: parseBmffHashHex(activeManifest.assertions),
		}
	} catch {
		return { manifest: null, issuer: null, liveVideo: null, bmffHashHex: null }
	}
}

/**
 * Validates a C2PA manifest-box live stream segment.
 *
 * Parses the C2PA manifest embedded in the segment and validates per §19.7.1 and §19.7.2.
 *
 * This function is **pure** — it does not access any external state. The
 * caller is responsible for persisting `nextManifestId` and `nextState`
 * between calls.
 *
 * @param bytes - Raw segment bytes
 * @param lastManifestId - Manifest ID from the previous segment, or null for the first segment
 * @param state - Optional state from the previous segment for streamId/sequenceNumber checks
 * @returns Validation result, the manifest ID, and state to persist for the next call
 *
 * @example
 * {@includeCode ../../test/manifestbox/validateC2paManifestBoxSegment.test.ts#example}
 *
 * @public
 */
export function validateC2paManifestBoxSegment(
	bytes: Uint8Array,
	lastManifestId: string | null,
	state?: ManifestBoxValidationState,
): {
	readonly result: ManifestBoxValidationResult
	readonly nextManifestId: string | null
	readonly nextState: ManifestBoxValidationState
} {
	const { manifest, issuer, liveVideo, bmffHashHex } = parseManifest(bytes)
	const hasManifest = manifest !== null
	const hasLiveVideo = liveVideo !== null

	const sequenceNumber = liveVideo?.sequenceNumber ?? null
	const previousManifestId = liveVideo?.previousManifestId ?? null
	const streamId = liveVideo?.streamId ?? null
	const continuityMethod = liveVideo?.continuityMethod ?? null

	const streamIdValid = state?.lastStreamId == null || streamId === state.lastStreamId
	const sequenceNumberValid =
		state?.lastSequenceNumber == null ||
		(sequenceNumber !== null && sequenceNumber > state.lastSequenceNumber)

	const codes = new Set<LiveVideoStatusCode>()
	if (!hasManifest) codes.add(LiveVideoStatusCode.MANIFEST_INVALID)
	if (!hasLiveVideo) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!streamIdValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!sequenceNumberValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)

	if (!continuityMethod) {
		codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
	} else if (!SUPPORTED_CONTINUITY_METHODS.has(continuityMethod)) {
		codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
	} else if (continuityMethod === CONTINUITY_METHOD_MANIFEST_ID) {
		if (!previousManifestId) {
			codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
		} else if (lastManifestId && normalizeManifestId(previousManifestId) !== normalizeManifestId(lastManifestId)) {
			// §19.7.2: previousManifestId value mismatch → SEGMENT_INVALID
			codes.add(LiveVideoStatusCode.SEGMENT_INVALID)
		}
	}

	const errorCodes = [...codes]

	const currentManifestId = manifest?.activeManifest?.instanceId ?? null

	return {
		result: {
			manifest,
			issuer,
			sequenceNumber,
			previousManifestId,
			streamId,
			continuityMethod,
			bmffHashHex,
			isValid: errorCodes.length === 0,
			errorCodes,
		},
		nextManifestId: currentManifestId ?? lastManifestId,
		nextState: {
			lastStreamId: streamId ?? state?.lastStreamId,
			lastSequenceNumber: sequenceNumber ?? state?.lastSequenceNumber,
		},
	}
}
