import type { SequenceState } from './SequenceState.ts'

/**
 * Creates the initial (empty) sequence state for a new stream.
 *
 * @returns A {@link SequenceState} with no history
 *
 * @example
 * {@includeCode ../../test/vsi/validateSequenceNumber.test.ts#example}
 *
 * @internal
 */
export function createSequenceState(): SequenceState {
	return { lastSequenceNumber: null, seenSequences: new Set() }
}
