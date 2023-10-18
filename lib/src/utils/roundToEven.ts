/**
 * This implements the rounding procedure described in step 2 of the "Serializing a Decimal" specification.
 * This rounding style is known as "even rounding", "banker's rounding", or "commercial rounding".
 */
export function roundToEven(value: number, precision: number): number {
	if (value < 0) {
		return -roundToEven(-value, precision);
	}

	const decimalShift = Math.pow(10, precision);
	const isEquidistant = Math.abs(((value * decimalShift) % 1) - 0.5) < Number.EPSILON;

	if (isEquidistant) {
		// If the tail of the decimal place is 'equidistant' we round to the nearest even value
		const flooredValue = Math.floor(value * decimalShift);
		return (flooredValue % 2 === 0 ? flooredValue : flooredValue + 1) / decimalShift;
	}
	else {
		// Otherwise, proceed as normal
		return Math.round(value * decimalShift) / decimalShift;
	}
}
