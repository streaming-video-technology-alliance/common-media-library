/**
 * Rounds a value with the procedure from step 2 of the "Serializing a Decimal" specification.
 * The style is known as "even rounding", "banker's rounding", or "commercial rounding".
 *
 * @example
 * {@includeCode ../test/roundToEven.test.ts#example}
 *
 * @param value - The value to round
 * @param precision - The number of decimal places to round to
 * @returns The rounded value
 *
 * @public
 */
export function roundToEven(value: number, precision: number): number {
	if (value < 0) {
		return -roundToEven(-value, precision)
	}

	const decimalShift = Math.pow(10, precision)
	const flooredValue = Math.floor(value * decimalShift)
	const midpoint = (flooredValue + 0.5) / decimalShift

	if (value === midpoint) {
		// If the tail of the decimal place is 'equidistant' we round to the nearest even value
		return (flooredValue % 2 === 0 ? flooredValue : flooredValue + 1) / decimalShift
	}

	return (value > midpoint ? flooredValue + 1 : flooredValue) / decimalShift
}
