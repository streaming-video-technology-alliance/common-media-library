import type { SequenceState, SequenceValidationResult } from './SequenceState.ts'

const SEEN_SEQUENCES_WINDOW_SIZE = 32

function pruneSeenSequences(seen: Set<number>, lastSequenceNumber: number): Set<number> {
	if (seen.size <= SEEN_SEQUENCES_WINDOW_SIZE) return seen
	const threshold = lastSequenceNumber - SEEN_SEQUENCES_WINDOW_SIZE
	const pruned = new Set<number>()
	for (const seq of seen) {
		if (seq >= threshold) pruned.add(seq)
	}
	return pruned
}

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
 * Internally uses a sliding window of the last 1 000 sequence numbers
 * to bound memory usage during long-running streams.
 *
 * @param state - Current stream state (from {@link createSequenceState} or previous `nextState`)
 * @param sequenceNumber - Sequence number from the segment's VSI map
 * @param minSequenceNumber - Minimum accepted sequence number (from the session key, default 0)
 * @returns Validation result and the updated state to persist
 *
 * @example
 * {@includeCode ../../test/vsi/validateSequenceNumber.test.ts#example}
 *
 * @internal
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
			nextState: {
				lastSequenceNumber: state.lastSequenceNumber,
				seenSequences: pruneSeenSequences(nextSeenSequences, state.lastSequenceNumber),
			},
		}
	}

	if (state.lastSequenceNumber !== null && sequenceNumber > state.lastSequenceNumber + 1) {
		const missingFrom = state.lastSequenceNumber + 1
		const missingTo = sequenceNumber - 1
		return {
			result: { isValid: false, reason: 'gap_detected', missingFrom, missingTo },
			nextState: {
				lastSequenceNumber: sequenceNumber,
				seenSequences: pruneSeenSequences(nextSeenSequences, sequenceNumber),
			},
		}
	}

	return {
		result: { isValid: true, reason: 'valid' },
		nextState: {
			lastSequenceNumber: sequenceNumber,
			seenSequences: pruneSeenSequences(nextSeenSequences, sequenceNumber),
		},
	}
}
