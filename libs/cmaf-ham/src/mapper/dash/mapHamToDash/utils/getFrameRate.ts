import type { Track } from '../../../../types/model/Track.ts'
import type { VideoTrack } from '../../../../types/model/VideoTrack.ts'

import {
	FRAME_RATE_NUMERATOR_30,
	ZERO,
} from '../../../../utils/constants.ts'


/**
 * @internal
 *
 * Get the framerate from a track.
 *
 * If frameRate numerator is not present, it uses 30 as default.
 *
 * @param track - to get the framerate from
 * @returns frame rate as a string formatted as `numerator/denominator`
 */
export function getFrameRate(track: Track): string | undefined {
	let frameRate: string | undefined = undefined
	if (track?.type === 'video') {
		const videoTrack = track as VideoTrack
		frameRate = `${videoTrack.frameRate.frameRateNumerator ?? FRAME_RATE_NUMERATOR_30}`
		frameRate =
			videoTrack.frameRate.frameRateDenominator !== ZERO
				? `${frameRate}/${videoTrack.frameRate.frameRateDenominator}`
				: frameRate
	}

	return frameRate
}
