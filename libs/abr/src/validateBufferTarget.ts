import { isPositiveFinite } from './isPositiveFinite.ts'

/**
 * Throws a `RangeError` when `bufferTarget` is not a positive finite number.
 *
 * @param bufferTarget - The buffer level in seconds that the player aims for
 */
export function validateBufferTarget(bufferTarget: number): void {
	if (!isPositiveFinite(bufferTarget)) {
		throw new RangeError(
			`Invalid bufferTarget: expected a positive finite number of seconds, received ${bufferTarget}`,
		)
	}
}
