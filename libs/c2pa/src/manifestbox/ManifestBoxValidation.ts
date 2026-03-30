import type { C2paManifestStore } from '../C2paManifest.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * The result of validating a single C2PA manifest-box live stream segment.
 *
 * Returned by {@link validateC2paManifestBoxSegment}.
 *
 * @public
 */
export type ManifestBoxValidationResult = {
  readonly manifest: C2paManifestStore | null
  readonly issuer: string | null
  readonly sequenceNumber: number | null
  readonly previousManifestId: string | null
  readonly streamId: string | null
  readonly continuityMethod: string | null
  readonly bmffHashHex: string | null
  readonly isValid: boolean
  readonly errorCodes: readonly LiveVideoStatusCode[]
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
