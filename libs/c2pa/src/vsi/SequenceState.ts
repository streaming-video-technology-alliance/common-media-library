import type { ValueOf } from '@svta/cml-utils'

/**
 * State and result types for monotonic sequence number validation
 * per C2PA Live Streaming Specification §18.4.
 *
 * @public
 */

/**
 * Immutable state snapshot for a single stream's sequence number history.
 *
 * Pass to {@link validateC2paSegment} via the `sequenceState` parameter.
 *
 * @public
 */
export type SequenceState = {
	readonly lastSequenceNumber: number | null
	readonly seenSequences: ReadonlySet<number>
}

/**
 * Reason codes for sequence number validation outcomes.
 *
 * @see {@link SequenceValidationResult}
 *
 * @enum
 *
 * @public
 */
export const SequenceValidationReason = {
	/** Sequence number is the next expected value */
	VALID: 'valid',
	/** Sequence number was already seen */
	DUPLICATE: 'duplicate',
	/** One or more sequence numbers were skipped */
	GAP_DETECTED: 'gap_detected',
	/** Sequence number is less than the last seen */
	OUT_OF_ORDER: 'out_of_order',
	/** Below the session key's minSequenceNumber */
	SEQUENCE_NUMBER_BELOW_MINIMUM: 'sequence_number_below_minimum',
} as const

/**
 * Union type of all {@link (SequenceValidationReason:variable)} values.
 *
 * @public
 */
export type SequenceValidationReason = ValueOf<typeof SequenceValidationReason>

/**
 * Result of validating a single sequence number against the current stream state.
 *
 * Discriminated on `reason` — narrow to `'gap_detected'` to access
 * `missingFrom` / `missingTo`.
 *
 * @public
 */
export type SequenceValidationResult =
	| { readonly isValid: true; readonly reason: typeof SequenceValidationReason.VALID }
	| {
			readonly isValid: false
			readonly reason:
				| typeof SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM
				| typeof SequenceValidationReason.DUPLICATE
				| typeof SequenceValidationReason.OUT_OF_ORDER
		}
	| {
			readonly isValid: false
			readonly reason: typeof SequenceValidationReason.GAP_DETECTED
			readonly missingFrom: number
			readonly missingTo: number
		}
