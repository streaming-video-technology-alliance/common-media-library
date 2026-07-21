import type { C2paManifest } from '../C2paManifest.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * The result of validating a single C2PA manifest-box live stream segment.
 *
 * Returned by {@link validateC2paManifestBoxSegment}.
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
 * Validates continuity for an implementer-defined continuity method (§19.3.2).
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
