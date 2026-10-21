import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paManifest } from '../C2paManifest.ts'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { asUnsignedInteger, bytesToHex, hashesEqual, normalizeAlgorithmName, toUint8Array } from '../utils.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import type { InternalManifestData } from '../claim/InternalManifestData.ts'
import { validateManifestIntegrity } from '../claim/validateManifestIntegrity.ts'
import type {
	ManifestBoxValidationOptions,
	ManifestBoxValidationResult,
	ManifestBoxValidationState,
} from './ManifestBoxValidation.ts'

const LIVE_VIDEO_ASSERTION_LABEL = 'c2pa.livevideo.segment'
const BMFF_HASH_ASSERTION_LABEL = 'c2pa.hash.bmff.v3'
const CONTINUITY_METHOD_MANIFEST_ID = 'c2pa.manifestId'

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
		sequenceNumber: asUnsignedInteger(rawSeq),
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
	/** The assertion has a hash that is not a byte string, or an exclusion that does not conform */
	malformed: boolean
}

const EMPTY_BMFF_HASH: BmffHashFields = { hashBytes: null, hashHex: null, exclusions: [], alg: null, malformed: false }

function parseBmffHashAssertion(assertions: readonly C2paAssertion[]): BmffHashFields {
	const assertion = assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL)
	if (!assertion) return EMPTY_BMFF_HASH

	// §19.3.1
	const data = extractAssertionData(assertion.data)
	if (!data) return { ...EMPTY_BMFF_HASH, malformed: true }

	const hashBytes = toUint8Array(data['hash'])
	const hashHex = hashBytes ? bytesToHex(hashBytes) : null
	const exclusions = parseExclusions(data['exclusions'])
	const alg = typeof data['alg'] === 'string' ? normalizeAlgorithmName(data['alg']) : null
	return { hashBytes, hashHex, exclusions: exclusions ?? [], alg, malformed: hashBytes === null || exclusions === null }
}

// --- Manifest parsing ---

type ParsedManifest = {
	manifest: C2paManifest | null
	issuer: string | null
	internalData: InternalManifestData | null
}

function parseManifest(bytes: Uint8Array): ParsedManifest {
	try {
		const internalData = readC2paManifest(bytes)
		const { manifest } = internalData
		if (!manifest) return { manifest: null, issuer: null, internalData: null }

		return {
			manifest,
			issuer: manifest.signatureInfo?.issuer ?? null,
			internalData,
		}
	} catch {
		return { manifest: null, issuer: null, internalData: null }
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
	manifest: C2paManifest | null,
	liveVideo: LiveVideoFields | null,
	lastManifestId: string | null,
	options?: ManifestBoxValidationOptions,
): Promise<readonly LiveVideoStatusCode[]> {
	const method = liveVideo?.continuityMethod ?? null

	if (!method) return [LiveVideoStatusCode.CONTINUITY_METHOD_INVALID]

	if (method === CONTINUITY_METHOD_MANIFEST_ID) {
		const prev = liveVideo?.previousManifestId ?? null
		if (!prev) return [LiveVideoStatusCode.CONTINUITY_METHOD_INVALID]
		const broken = !!lastManifestId && prev !== lastManifestId
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
 * it against the expected hash in the manifest assertion. A manifest without a
 * `c2pa.hash.bmff.v3` assertion, or with one that has no hash, fails. Checks live-video assertions
 * (sequenceNumber, streamId, continuityMethod) and manifest-ID chain continuity.
 * The live-video and BMFF hash fields of the result come only from assertions whose
 * hash matches a claim reference. Check `isValid` before you use any field.
 * A validator for an implementer-defined continuity method can be registered
 * via {@link ManifestBoxValidationOptions}.
 *
 * This function is **pure** — it does not access any external state. The
 * caller is responsible for persisting `nextManifestId` and `nextState`
 * between calls. A segment that fails verification, is on another stream, or
 * does not move the sequence number forward returns the received
 * `lastManifestId` and `state` unchanged. A segment that fails only the
 * continuity check still updates them.
 *
 * @param bytes - Raw segment bytes
 * @param lastManifestId - Manifest ID from the last segment that updated the state, or `null` for the first segment
 * @param state - Optional state from the last segment that updated the state, for the streamId and sequenceNumber checks
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
	const { manifest, issuer, internalData } = parseManifest(bytes)

	const integrity = internalData ? await validateManifestIntegrity(internalData) : null
	const verifiedAssertions = integrity?.verifiedAssertions ?? []
	const liveVideo = parseLiveVideoAssertion(verifiedAssertions)
	const bmff = parseBmffHashAssertion(verifiedAssertions)

	const sequenceNumber = liveVideo?.sequenceNumber ?? null
	const previousManifestId = liveVideo?.previousManifestId ?? null
	const streamId = liveVideo?.streamId ?? null
	const continuityMethod = liveVideo?.continuityMethod ?? null

	const streamIdValid = state?.lastStreamId == null || streamId === state.lastStreamId
	const sequenceNumberValid =
		state?.lastSequenceNumber == null ||
		(sequenceNumber !== null && sequenceNumber > state.lastSequenceNumber)

	// §19.3.1: the manifest of each segment has a c2pa.hash.bmff.v3 assertion. Without it, nothing binds the segment content.
	const bmffHashMissing = internalData !== null && !internalData.assertions.some(a => a.label === BMFF_HASH_ASSERTION_LABEL)
	let bmffHashMatches = !bmffHashMissing
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

	const continuityCodes = await validateContinuity(manifest, liveVideo, lastManifestId, options)

	const liveVideoCodes = [...new Set([
		...collectErrorCodes(
			manifest !== null, liveVideo !== null,
			streamIdValid, sequenceNumberValid, bmffHashMatches,
		),
		...continuityCodes,
	])]

	const integrityCodes: readonly C2paStatusCode[] = integrity?.codes ?? []

	const errorCodes: (LiveVideoStatusCode | C2paStatusCode)[] = [...liveVideoCodes, ...integrityCodes]
	if (bmff.malformed) errorCodes.push(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED)
	// §15.10.1.2: a manifest without any hard binding assertion is rejected.
	if (integrity?.hardBindingCount === 0) errorCodes.push(C2paStatusCode.CLAIM_HARD_BINDINGS_MISSING)

	// §19.3: previousManifestId holds the manifest identifier, which is the JUMBF label of the manifest (C2PA URN).
	// The label is authenticated only through the claim `signature` URI. If that URI does not name the label,
	// it does not resolve to the signature in the same manifest, which fails with claimSignature.missing.
	const currentManifestId = internalData?.manifestId ?? null
	const claimDecoded = internalData !== null && internalData.claimCborBytes !== null && internalData.claimCode === null
	if (claimDecoded && currentManifestId === null && !errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING)) {
		errorCodes.push(C2paStatusCode.CLAIM_SIGNATURE_MISSING)
	}

	// The continuity check does not gate the advance.
	const authentic = manifest !== null && liveVideo !== null && integrity !== null && integrity.codes.length === 0 && bmffHashMatches && !bmff.malformed && currentManifestId !== null
	const advance = authentic && streamIdValid && sequenceNumberValid

	return {
		result: {
			manifest: manifest ?? null,
			issuer,
			certificate: integrity?.certificate ?? null,
			sequenceNumber,
			previousManifestId,
			streamId,
			continuityMethod,
			bmffHashHex: bmff.hashHex,
			isValid: errorCodes.length === 0,
			errorCodes,
		},
		nextManifestId: advance ? (currentManifestId ?? lastManifestId) : lastManifestId,
		nextState: advance
			? {
					lastStreamId: streamId ?? state?.lastStreamId,
					lastSequenceNumber: sequenceNumber ?? state?.lastSequenceNumber,
				}
			: (state ?? {}),
	}
}
