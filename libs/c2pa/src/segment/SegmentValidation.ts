import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import type { SequenceValidationResult } from '../vsi/SequenceState.ts'

/**
 * The result of validating a single C2PA live stream segment (VSI/EMSG method).
 *
 * Returned by {@link validateC2paSegment}.
 *
 * @public
 */
export type SegmentValidationResult = {
	readonly sequenceNumber: number
	readonly manifestId: string
	readonly bmffHashHex: string | null
	readonly kidHex: string | null
	readonly sequenceResult: SequenceValidationResult
	readonly isValid: boolean
	readonly errorCodes: readonly LiveVideoStatusCode[]
}
