/**
 * Returns `true` when `value` is a finite number above 0.
 *
 * @param value - The value to test
 * @returns Whether the value is a positive finite number
 */
export function isPositiveFinite(value: number | undefined): value is number {
	return Number.isFinite(value) && (value as number) > 0
}
