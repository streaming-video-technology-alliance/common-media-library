/**
 * Video Frame Rate
 * Used to express the framerate as numerator and denominator.
 *
 * frameRateNumerator - Numerator.
 * frameRateDenominator - Denominator.
 *
 * @alpha
*/

export type FrameRate = {
	frameRateNumerator: number;
	frameRateDenominator?: number;
};
