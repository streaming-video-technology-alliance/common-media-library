import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paManifest } from '../C2paManifest.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { bytesToHex, hashesEqual, normalizeAlgorithmName, toUint8Array } from '../utils.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import type { InternalManifestData } from '../claim/InternalManifestData.ts'
import { validateManifestIntegrity } from '../claim/validateManifestIntegrity.ts'
import { extractCertificateFromSignatureBytes } from '../extractManifestCertificate.ts'
import type {
	ManifestBoxValidationOptions,
	ManifestBoxValidationResult,
	ManifestBoxValidationState,
} from './ManifestBoxValidation.ts'

const LIVE_VIDEO_ASSERTION_LABEL = 'c2pa.livevideo.segment'
const BMFF_HASH_ASSERTION_LABEL = 'c2pa.hash.bmff.v3'
const MANIFEST_ID_PREFIX_PATTERN = /^(xmp:iid:|urn:uuid:)/i
const CONTINUITY_METHOD_MANIFEST_ID = 'c2pa.manifestId'

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

// --- Live video assertion parsing ---

type LiveVideoFields = {
	sequenceNumber: number | null
	previousManifestId: string | null
	streamId: string | null
	continuityMethod: string | null
	data: Record<string, unknown>
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
		data: data ?? {},
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
	internalData: InternalManifestData | null
}

function parseManifest(bytes: Uint8Array): ParsedManifest {
	try {
		const internalData = readC2paManifest(bytes)
		const { manifest } = internalData
		if (!manifest) return { manifest: null, issuer: null, liveVideo: null, bmff: EMPTY_BMFF_HASH, internalData: null }

		return {
			manifest,
			issuer: manifest.signatureInfo?.issuer ?? null,
			liveVideo: parseLiveVideoAssertion(manifest.assertions),
			bmff: parseBmffHashAssertion(manifest.assertions),
			internalData,
		}
	} catch {
		return { manifest: null, issuer: null, liveVideo: null, bmff: EMPTY_BMFF_HASH, internalData: null }
	}
}

// --- Validation ---

function collectErrorCodes(
	hasManifest: boolean,
	hasLiveVideo: boolean,
	streamIdValid: boolean,
	sequenceNumberValid: boolean,
	bmffHashMatches: boolean,
): readonly LiveVideoStatusCode[] {
	const codes = new Set<LiveVideoStatusCode>()

	if (!hasManifest) codes.add(LiveVideoStatusCode.MANIFEST_INVALID)
	if (!hasLiveVideo) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!streamIdValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!sequenceNumberValid) codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
	if (!bmffHashMatches) codes.add(LiveVideoStatusCode.SEGMENT_INVALID)

	return [...codes]
}

async function validateContinuity(
	parsed: ParsedManifest,
	lastManifestId: string | null,
	options?: ManifestBoxValidationOptions,
): Promise<readonly LiveVideoStatusCode[]> {
	const { manifest, liveVideo } = parsed
	const method = liveVideo?.continuityMethod ?? null

	if (!method) return [LiveVideoStatusCode.CONTINUITY_METHOD_INVALID]

	if (method === CONTINUITY_METHOD_MANIFEST_ID) {
		const prev = liveVideo?.previousManifestId ?? null
		if (!prev) return [LiveVideoStatusCode.CONTINUITY_METHOD_INVALID]
		const broken = !!lastManifestId && normalizeManifestId(prev) !== normalizeManifestId(lastManifestId)
		return broken ? [LiveVideoStatusCode.SEGMENT_INVALID] : []
	}

	const custom = options?.continuityValidator
	if (custom?.method !== method || !manifest || !liveVideo) {
		return [LiveVideoStatusCode.CONTINUITY_METHOD_INVALID, LiveVideoStatusCode.CONTINUITY_METHOD_UNSUPPORTED]
	}

	const ok = await Promise.resolve()
		.then(() => custom.validate(liveVideo.data, manifest))
		.catch(() => false)
	return ok ? [] : [LiveVideoStatusCode.SEGMENT_INVALID]
}

/**
 * Validates a C2PA manifest-box live stream segment.
 *
 * Parses the C2PA manifest embedded in the segment and validates per §19.7.1 and §19.7.2.
 * Recomputes the `c2pa.hash.bmff.v3` content hash from the raw segment bytes and compares
 * it against the expected hash in the manifest assertion. Checks live-video assertions
 * (sequenceNumber, streamId, continuityMethod) and manifest-ID chain continuity.
 * A validator for an implementer-defined continuity method can be registered
 * via {@link ManifestBoxValidationOptions}.
 *
 * This function is **pure** — it does not access any external state. The
 * caller is responsible for persisting `nextManifestId` and `nextState`
 * between calls.
 *
 * @param bytes - Raw segment bytes
 * @param lastManifestId - Manifest ID from the previous segment, or null for the first segment
 * @param state - Optional state from the previous segment for streamId/sequenceNumber checks
 * @param options - Optional custom continuity method validator
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
	options?: ManifestBoxValidationOptions,
): Promise<{
	readonly result: ManifestBoxValidationResult
	readonly nextManifestId: string | null
	readonly nextState: ManifestBoxValidationState
}> {
	const { manifest, issuer, liveVideo, bmff, internalData } = parseManifest(bytes)

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
		// §18.6.2: the flat v2/v3 hash covers offset || data for every non-excluded root
		// box; only Merkle tree hashes may omit the 8-byte offset prefix.
		const computed = await computeBmffHash(bytes, {
			exclusions: bmff.exclusions,
			alg: bmff.alg ?? undefined,
			offsetPrefixSize: 8,
		})
		bmffHashMatches = hashesEqual(computed, bmff.hashBytes)
	}

	const continuityCodes = await validateContinuity({ manifest, issuer, liveVideo, bmff, internalData }, lastManifestId, options)

	const liveVideoCodes = [...new Set([
		...collectErrorCodes(
			manifest !== null, liveVideo !== null,
			streamIdValid, sequenceNumberValid, bmffHashMatches,
		),
		...continuityCodes,
	])]

	const integrityCodes: readonly C2paStatusCode[] = internalData
		? await validateManifestIntegrity(
			internalData,
			internalData.signatureBytes ? extractCertificateFromSignatureBytes(internalData.signatureBytes) : null,
		)
		: []

	const errorCodes: (LiveVideoStatusCode | C2paStatusCode)[] = [...liveVideoCodes, ...integrityCodes]

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
