import type { SequenceState, SequenceValidationResult } from './SequenceState.ts'

/**
 * Validates a segment's sequence number against the current stream state
 * per C2PA Live Streaming Specification §18.4.
 *
 * This function is **pure and stateless** — it returns both the validation
 * result and the next state. The caller is responsible for persisting
 * `nextState` between calls.
 *
 * Detects: `duplicate`, `out_of_order`, `gap_detected`, and
 * `sequence_number_below_minimum`.
 *
 * @param state - Current stream state (from {@link createSequenceState} or previous `nextState`)
 * @param sequenceNumber - Sequence number from the segment's VSI map
 * @param minSequenceNumber - Minimum accepted sequence number (from the session key, default 0)
 * @returns Validation result and the updated state to persist
 *
 * @example
 * {@includeCode ../../test/vsi/validateSequenceNumber.test.ts#example}
 *
 * @public
 */
export function validateSequenceNumber(
	state: SequenceState,
	sequenceNumber: number,
	minSequenceNumber: number,
): { readonly result: SequenceValidationResult; readonly nextState: SequenceState } {
	if (sequenceNumber < minSequenceNumber) {
		return {
			result: { isValid: false, reason: 'sequence_number_below_minimum' },
			nextState: state,
		}
	}

	if (state.seenSequences.has(sequenceNumber)) {
		return {
			result: { isValid: false, reason: 'duplicate' },
			nextState: state,
		}
	}

	const nextSeenSequences = new Set(state.seenSequences)
	nextSeenSequences.add(sequenceNumber)

	if (state.lastSequenceNumber !== null && sequenceNumber < state.lastSequenceNumber) {
		return {
			result: { isValid: false, reason: 'out_of_order' },
			nextState: { lastSequenceNumber: state.lastSequenceNumber, seenSequences: nextSeenSequences },
		}
	}

	if (state.lastSequenceNumber !== null && sequenceNumber > state.lastSequenceNumber + 1) {
		const missingFrom = state.lastSequenceNumber + 1
		const missingTo = sequenceNumber - 1
		return {
			result: { isValid: false, reason: 'gap_detected', missingFrom, missingTo },
			nextState: { lastSequenceNumber: sequenceNumber, seenSequences: nextSeenSequences },
		}
	}

	return {
		result: { isValid: true, reason: 'valid' },
		nextState: { lastSequenceNumber: sequenceNumber, seenSequences: nextSeenSequences },
	}
}
