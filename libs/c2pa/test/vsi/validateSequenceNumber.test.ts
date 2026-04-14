import { createSequenceState } from '../../src/vsi/createSequenceState.ts'
import { SequenceValidationReason } from '../../src/vsi/SequenceState.ts'
import { validateSequenceNumber } from '../../src/vsi/validateSequenceNumber.ts'
import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateSequenceNumber', () => {
	// #region example
	it('accepts valid sequential segments', () => {
		let state = createSequenceState()

		let { result, nextState } = validateSequenceNumber(state, 1, 0)
		strictEqual(result.isValid, true)
		strictEqual(result.reason, SequenceValidationReason.VALID)
		state = nextState

		;({ result, nextState } = validateSequenceNumber(state, 2, 0))
		strictEqual(result.isValid, true)
		strictEqual(result.reason, SequenceValidationReason.VALID)
	})
	// #endregion example

	it('rejects sequence number below minimum', () => {
		const state = createSequenceState()
		const { result, nextState } = validateSequenceNumber(state, 3, 5)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM)
		strictEqual(nextState, state)
	})

	it('rejects duplicate sequence number', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 5, 0).nextState

		const { result, nextState } = validateSequenceNumber(state, 5, 0)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.DUPLICATE)
		strictEqual(nextState, state)
	})

	it('rejects out-of-order sequence number', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 5, 0).nextState

		const { result } = validateSequenceNumber(state, 3, 0)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.OUT_OF_ORDER)
	})

	it('detects gap and reports missing range', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 1, 0).nextState

		const { result } = validateSequenceNumber(state, 4, 0)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.GAP_DETECTED)
		if (result.reason === SequenceValidationReason.GAP_DETECTED) {
			strictEqual(result.missingFrom, 2)
			strictEqual(result.missingTo, 3)
		}
	})

	it('accepts first segment regardless of value (no lastSequenceNumber)', () => {
		const state = createSequenceState()
		const { result } = validateSequenceNumber(state, 100, 0)
		strictEqual(result.isValid, true)
	})

	it('does not mutate the original state', () => {
		const state = createSequenceState()
		validateSequenceNumber(state, 1, 0)
		strictEqual(state.lastSequenceNumber, null)
		strictEqual(state.seenSequences.size, 0)
	})

	it('detects large gap and reports full missing range', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 1, 0).nextState

		const { result } = validateSequenceNumber(state, 10, 0)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.GAP_DETECTED)
		if (result.reason === SequenceValidationReason.GAP_DETECTED) {
			strictEqual(result.missingFrom, 2)
			strictEqual(result.missingTo, 9)
		}
	})

	it('detects single-element gap', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 1, 0).nextState

		const { result } = validateSequenceNumber(state, 3, 0)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.GAP_DETECTED)
		if (result.reason === SequenceValidationReason.GAP_DETECTED) {
			strictEqual(result.missingFrom, 2)
			strictEqual(result.missingTo, 2)
		}
	})

	it('rejects below-minimum even after advancing state', () => {
		let state = createSequenceState()
		state = validateSequenceNumber(state, 5, 0).nextState

		const { result } = validateSequenceNumber(state, 3, 4)
		strictEqual(result.isValid, false)
		strictEqual(result.reason, SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM)
	})
})
