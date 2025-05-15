import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.js';
import type { Representation } from '../../../../types/mapper/dash/Representation.js';

import type { FrameRate } from '../../../../types/model/FrameRate.js';

import {
	DENOMINATOR,
	FRAME_RATE_NUMERATOR_30,
	FRAME_RATE_SEPARATOR,
	NUMERATOR,
	ZERO,
} from '../../../../utils/constants.ts';

/**
 * @internal
 *
 * Get the frame rate from a dash manifest.
 *
 * This functions assumes the adaptationSet and representation set are type video
 *
 * @param adaptationSet - To try to get the frameRate from
 * @param representation - To try to get the frameRate from
 * @returns object containing numerator and denominator
 */
export function getFrameRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): FrameRate {
	const frameRateDash: string =
		representation.$.frameRate ?? adaptationSet.$.frameRate ?? '';
	if (!frameRateDash) {
		console.error(
			`Representation ${representation.$.id} has no frame rate`,
		);
	}
	const frameRate = frameRateDash.split(FRAME_RATE_SEPARATOR);
	const frameRateNumerator = parseInt(frameRate.at(NUMERATOR) ?? '');
	const frameRateDenominator = parseInt(frameRate.at(DENOMINATOR) ?? '');

	return {
		frameRateNumerator: isNaN(frameRateNumerator)
			? FRAME_RATE_NUMERATOR_30
			: frameRateNumerator,
		frameRateDenominator: isNaN(frameRateDenominator)
			? ZERO
			: frameRateDenominator,
	} as FrameRate;
}
