import type { C2paManifest } from '../C2paManifest.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * The result of validating a single C2PA manifest-box live stream segment.
 *
 * A segment declaring a continuity method the validator cannot verify (an
 * implementer-defined method with no validator registered via
 * {@link ManifestBoxValidationOptions}) fails with
 * `livevideo.continuityMethod.invalid` (§19.7.2) plus
 * `livevideo.continuityMethod.unsupported` in `errorCodes`.
 *
 * Returned by `validateC2paManifestBoxSegment`.
 *
 * @public
 */
export type ManifestBoxValidationResult = {
	readonly manifest: C2paManifest | null
	readonly issuer: string | null
	readonly sequenceNumber: number | null
	readonly previousManifestId: string | null
	readonly streamId: string | null
	readonly continuityMethod: string | null
	readonly bmffHashHex: string | null
	readonly isValid: boolean
	readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[]
}

/**
 * Validates continuity for a custom (implementer-defined) continuity method.
 *
 * `liveVideoAssertion` is the raw decoded `c2pa.livevideo.segment` assertion
 * data, including any method-specific fields (§19.3.2 allows implementers to
 * add fields named per §6.2). `manifest` is the segment's parsed manifest.
 *
 * Return `true` when the segment correctly chains to the previous one, and
 * `false` otherwise (reported as `livevideo.segment.invalid`). A thrown error
 * is treated as `false`.
 *
 * @public
 */
export type ManifestBoxContinuityValidator = (
	liveVideoAssertion: Readonly<Record<string, unknown>>,
	manifest: C2paManifest,
) => boolean | Promise<boolean>

/**
 * Options for `validateC2paManifestBoxSegment`.
 *
 * `continuityValidator` registers a validator for one custom continuity method
 * label (e.g. `com.example.anchor-chain`); a stream uses a single method. The
 * spec-defined `c2pa.manifestId` method is always validated built-in and cannot
 * be overridden. Segments declaring any other method than the registered one
 * fail with `livevideo.continuityMethod.invalid` (§19.7.2) plus
 * `livevideo.continuityMethod.unsupported`.
 *
 * @public
 */
export type ManifestBoxValidationOptions = {
	readonly continuityValidator?: {
		readonly method: string
		readonly validate: ManifestBoxContinuityValidator
	}
}

/**
 * State to carry between consecutive manifest-box segment validations.
 *
 * Pass the `nextState` returned by {@link validateC2paManifestBoxSegment}
 * into the next call to enable streamId, sequenceNumber, and continuity checks.
 *
 * @public
 */
export type ManifestBoxValidationState = {
	readonly lastStreamId?: string | null
	readonly lastSequenceNumber?: number | null
}
