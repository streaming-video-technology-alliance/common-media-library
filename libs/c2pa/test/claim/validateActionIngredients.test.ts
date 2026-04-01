import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateActionIngredients } from '../../src/claim/validateActionIngredients.ts'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateActionIngredients', () => {
	// #region example
	it('returns empty array when no actions assertions exist', () => {
		const codes = validateActionIngredients([
			{ label: 'c2pa.hash.bmff.v3', data: {} },
		])
		deepStrictEqual(codes, [])
	})
	// #endregion example

	it('returns empty array for actions that do not require ingredients', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{ action: 'c2pa.created' },
					{ action: 'c2pa.edited' },
				],
			},
		}])
		deepStrictEqual(codes, [])
	})

	it('reports mismatch when c2pa.opened is missing parameters.ingredients', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{ action: 'c2pa.opened' },
				],
			},
		}])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH])
	})

	it('reports mismatch when c2pa.placed has empty ingredients array', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{ action: 'c2pa.placed', parameters: { ingredients: [] } },
				],
			},
		}])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH])
	})

	it('reports mismatch when c2pa.removed is missing parameters field entirely', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{ action: 'c2pa.removed', parameters: {} },
				],
			},
		}])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH])
	})

	it('passes when c2pa.opened has valid ingredients', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{
						action: 'c2pa.opened',
						parameters: {
							ingredients: [{ url: 'self#jumbf=/c2pa/ingredient', hash: new Uint8Array(32) }],
						},
					},
				],
			},
		}])
		deepStrictEqual(codes, [])
	})

	it('reports multiple mismatches for multiple failing actions', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: {
				actions: [
					{ action: 'c2pa.opened' },
					{ action: 'c2pa.placed' },
					{ action: 'c2pa.created' },
				],
			},
		}])
		strictEqual(codes.length, 2)
	})

	it('checks both c2pa.actions and c2pa.actions.v2 labels', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions',
			data: {
				actions: [
					{ action: 'c2pa.opened' },
				],
			},
		}])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH])
	})

	it('returns empty array when assertions list is empty', () => {
		const codes = validateActionIngredients([])
		deepStrictEqual(codes, [])
	})

	it('handles null data gracefully', () => {
		const codes = validateActionIngredients([{
			label: 'c2pa.actions.v2',
			data: null,
		}])
		deepStrictEqual(codes, [])
	})
})
