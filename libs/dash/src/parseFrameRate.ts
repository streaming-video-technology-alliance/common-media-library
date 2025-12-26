/**
 * Parses a DASH framerate string into a number.
 *
 * @param frameRate - The frame rate string to parse.
 * @returns The frame rate as a number.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/parseFrameRate.test.ts#example}
 */
export function parseFrameRate(frameRate: string): number {
	const [numerator, denominator] = frameRate.split('/').map(value => parseInt(value, 10))

	if (denominator === undefined) {
		return numerator
	}

	if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
		return NaN
	}

	return numerator / denominator
}
