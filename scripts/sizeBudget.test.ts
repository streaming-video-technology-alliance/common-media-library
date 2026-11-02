import { deepEqual, equal, throws } from 'node:assert/strict'
import { describe, it } from 'vite-plus/test'
import { isOverBudget, parseBudget } from './sizeBudget.ts'

const FILE = 'libs/example/config/size-budget.json'

const BUDGET = {
	tolerance: 0.02,
	typeOnlyPeers: true,
	entries: {
		'bare import': { imports: [], brotli: 1 },
		encode: { imports: ['encode'], brotli: 100 },
	},
}

describe('parseBudget', () => {
	it('returns a valid budget', () => {
		deepEqual(parseBudget(FILE, BUDGET), BUDGET)
	})

	it('accepts an entry without imports and a budget without typeOnlyPeers', () => {
		const budget = { tolerance: 0, entries: { bare: { imports: [], brotli: 0 } } }

		deepEqual(parseBudget(FILE, budget), budget)
	})

	it('names the file and the field in the error', () => {
		throws(() => parseBudget(FILE, { ...BUDGET, tolerance: -1 }), {
			message: `${FILE}: "tolerance" must be a number of at least 0. Received -1.`,
		})
	})

	it('rejects a file that is not an object', () => {
		throws(() => parseBudget(FILE, []), { message: /"\(file\)" must be an object/ })
	})

	it('rejects a typeOnlyPeers value that is not a boolean', () => {
		throws(() => parseBudget(FILE, { ...BUDGET, typeOnlyPeers: 'yes' }), {
			message: /"typeOnlyPeers" must be a boolean/,
		})
	})

	it('rejects empty entries', () => {
		throws(() => parseBudget(FILE, { ...BUDGET, entries: {} }), {
			message: /"entries" must be an object with at least one entry/,
		})
	})

	it('rejects an import that is not an export name', () => {
		const entries = { bad: { imports: ['a; globalThis.x = 1'], brotli: 1 } }

		throws(() => parseBudget(FILE, { ...BUDGET, entries }), {
			message: /"entries.bad.imports" must be an array of export names/,
		})
	})

	it('rejects a brotli budget that is not an integer of at least 0', () => {
		for (const brotli of [-1, 1.5, '100']) {
			const entries = { bad: { imports: ['encode'], brotli } }

			throws(() => parseBudget(FILE, { ...BUDGET, entries }), {
				message: /"entries.bad.brotli" must be an integer of at least 0/,
			})
		}
	})
})

describe('isOverBudget', () => {
	it('allows a size up to the budget plus the tolerance', () => {
		equal(isOverBudget(102, 100, 0.02), false)
		equal(isOverBudget(103, 100, 0.02), true)
	})

	it('fails any growth of a budget of 1 with a 2% tolerance', () => {
		equal(isOverBudget(1, 1, 0.02), false)
		equal(isOverBudget(2, 1, 0.02), true)
	})
})
