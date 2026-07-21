import type { ValueOf } from '@svta/cml-utils'

/**
 * Standard C2PA failure status codes for live video validation,
 * as defined in the C2PA specification section 19.7.
 *
 * @see {@link https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html#_live_video_validation_process | C2PA Spec §19.7}
 *
 * @enum
 *
 * @public
 */
export const LiveVideoStatusCode = {
	/** Init segment contains an `mdat` box (§19.7.1) */
	INIT_INVALID: 'livevideo.init.invalid',
	/** C2PA Manifest Box failed standard validation (§19.7.1) */
	MANIFEST_INVALID: 'livevideo.manifest.invalid',
	/** Segment structure invalid: missing Manifest Box/emsg, signature/hash/key failure (§19.7) */
	SEGMENT_INVALID: 'livevideo.segment.invalid',
	/**
	 * Live video assertion field invalid: sequenceNumber or streamId mismatch
	 * (§19.7.2). Also reused for VOD Merkle per-track location discontinuity
	 * (§15.12.2), which has no dedicated code.
	 */
	ASSERTION_INVALID: 'livevideo.assertion.invalid',
	/** continuityMethod absent, unsupported, or companion fields incorrect (§19.7.2) */
	CONTINUITY_METHOD_INVALID: 'livevideo.continuityMethod.invalid',
	/** Custom continuityMethod with no registered validator (§19.7.2) */
	CONTINUITY_METHOD_UNSUPPORTED: 'livevideo.continuityMethod.unsupported',
	/** Session key invalid: signerBinding failed or required fields absent (§19.7.3) */
	SESSIONKEY_INVALID: 'livevideo.sessionkey.invalid',
} as const

/**
 * Union type of all {@link (LiveVideoStatusCode:variable)} values.
 *
 * @public
 */
export type LiveVideoStatusCode = ValueOf<typeof LiveVideoStatusCode>
