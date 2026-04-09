import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paManifest } from '../C2paManifest.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { bytesToHex, normalizeAlgorithmName } from '../utils.ts'
import { validateBmffHash } from '../bmff/validateBmffHash.ts'
import type { BmffHashConstraint, BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
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

function toUint8Array(value: unknown): Uint8Array | null {
	if (value instanceof Uint8Array) return value
	if (Array.isArray(value)) return new Uint8Array(value as number[])
	return null
}

// --- Live video assertion parsing ---

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

// --- BMFF hash assertion parsing ---

type BmffHashFields = {
	hashBytes: Uint8Array | null
	hashHex: string | null
	exclusions: readonly BmffHashExclusion[]
	alg: string | null
}

const EMPTY_BMFF_HASH: BmffHashFields = { hashBytes: null, hashHex: null, exclusions: [], alg: null }

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

function parseExclusions(rawExclusions: unknown): BmffHashExclusion[] {
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

function parseBmffHashAssertion(assertions: readonly C2paAssertion[]): BmffHashFields {
	const assertion = assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL)
	if (!assertion) return EMPTY_BMFF_HASH

	const data = extractAssertionData(assertion.data)
	if (!data) return EMPTY_BMFF_HASH

	const hashBytes = toUint8Array(data['hash'] ?? data['value'])
	const hashHex = hashBytes ? bytesToHex(hashBytes) : null
	const exclusions = parseExclusions(data['exclusions'])
	const alg = typeof data['alg'] === 'string' ? normalizeAlgorithmName(data['alg']) : null
	return { hashBytes, hashHex, exclusions, alg }
}

// --- Manifest parsing ---

type ParsedManifest = {
	manifest: C2paManifest | null
	issuer: string | null
	liveVideo: LiveVideoFields | null
	bmff: BmffHashFields
}

function parseManifest(bytes: Uint8Array): ParsedManifest {
	try {
		const { manifest } = readC2paManifest(bytes)
		if (!manifest) return { manifest: null, issuer: null, liveVideo: null, bmff: EMPTY_BMFF_HASH }

		return {
			manifest,
			issuer: manifest.signatureInfo?.issuer ?? null,
			liveVideo: parseLiveVideoAssertion(manifest.assertions),
			bmff: parseBmffHashAssertion(manifest.assertions),
		}
	} catch {
		return { manifest: null, issuer: null, liveVideo: null, bmff: EMPTY_BMFF_HASH }
	}
}

// --- Validation ---

function collectErrorCodes(
	hasManifest: boolean,
	hasLiveVideo: boolean,
	streamIdValid: boolean,
	sequenceNumberValid: boolean,
	bmffHashMatches: boolean,
	continuityMethod: string | null,
	previousManifestId: string | null,
	lastManifestId: string | null,
): readonly LiveVideoStatusCode[] {
	const codes = new Set<LiveVideoStatusCode>()

	if (!hasManifest) codes.add(LiveVideoStatusCode.MANIFEST_INVALID)
	if (!hasLiveVideo) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!streamIdValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!sequenceNumberValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!bmffHashMatches) codes.add(LiveVideoStatusCode.SEGMENT_INVALID)

	if (!continuityMethod) {
		codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
	} else if (!SUPPORTED_CONTINUITY_METHODS.has(continuityMethod)) {
		codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
	} else if (continuityMethod === CONTINUITY_METHOD_MANIFEST_ID) {
		if (!previousManifestId) {
			codes.add(LiveVideoStatusCode.CONTINUITY_METHOD_INVALID)
		} else if (lastManifestId && normalizeManifestId(previousManifestId) !== normalizeManifestId(lastManifestId)) {
			codes.add(LiveVideoStatusCode.SEGMENT_INVALID)
		}
	}

	return [...codes]
}

/**
 * Validates a C2PA manifest-box live stream segment.
 *
 * Parses the C2PA manifest embedded in the segment and validates per §19.7.1 and §19.7.2.
 * Recomputes the `c2pa.hash.bmff.v3` content hash from the raw segment bytes and compares
 * it against the expected hash in the manifest assertion. Checks live-video assertions
 * (sequenceNumber, streamId, continuityMethod) and manifest-ID chain continuity.
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
export async function validateC2paManifestBoxSegment(
	bytes: Uint8Array,
	lastManifestId: string | null,
	state?: ManifestBoxValidationState,
): Promise<{
	readonly result: ManifestBoxValidationResult
	readonly nextManifestId: string | null
	readonly nextState: ManifestBoxValidationState
}> {
	const { manifest, issuer, liveVideo, bmff } = parseManifest(bytes)

	const sequenceNumber = liveVideo?.sequenceNumber ?? null
	const previousManifestId = liveVideo?.previousManifestId ?? null
	const streamId = liveVideo?.streamId ?? null
	const continuityMethod = liveVideo?.continuityMethod ?? null

	const streamIdValid = state?.lastStreamId == null || streamId === state.lastStreamId
	const sequenceNumberValid =
		state?.lastSequenceNumber == null ||
		(sequenceNumber !== null && sequenceNumber > state.lastSequenceNumber)

	let bmffHashMatches = true
	if (bmff.hashBytes !== null) {
		bmffHashMatches = await validateBmffHash(bytes, bmff.hashBytes, {
			exclusions: bmff.exclusions,
			alg: bmff.alg ?? undefined,
		})
	}

	const liveVideoCodes = collectErrorCodes(
		manifest !== null, liveVideo !== null,
		streamIdValid, sequenceNumberValid, bmffHashMatches,
		continuityMethod, previousManifestId, lastManifestId,
	)

	const errorCodes: (LiveVideoStatusCode | C2paStatusCode)[] = [...liveVideoCodes]

	const currentManifestId = manifest?.instanceId ?? null

	return {
		result: {
			manifest: manifest ?? null,
			issuer,
			sequenceNumber,
			previousManifestId,
			streamId,
			continuityMethod,
			bmffHashHex: bmff.hashHex,
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
