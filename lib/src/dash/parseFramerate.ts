/**
 * Parses a DASH framerate string into a number.
 *
 * @param framerate - The framerate string to parse.
 * @returns The framerate as a number.
 *
 * @group DASH
 * @beta
 *
 * @example
 * {@includeCode ../../test/dash/parseFramerate.test.ts#example}
 */
export function parseFramerate(framerate: string): number {
	const [numerator, denominator] = framerate.split('/').map(value => parseInt(value, 10));

	if (denominator === undefined) {
		return numerator;
	}

	if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
		return NaN;
	}

	return numerator / denominator;
}
