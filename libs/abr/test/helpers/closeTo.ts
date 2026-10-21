import { ok } from 'node:assert'

/**
 * Asserts that two numbers differ by at most `tolerance`.
 */
export function closeTo(actual: number, expected: number, tolerance: number, message?: string): void {
	ok(Math.abs(actual - expected) <= tolerance, message ?? `expected ${actual} to be within ${tolerance} of ${expected}`)
}
