import type { AudioTrack, Track, VideoTrack } from '../../types/model';
import {
	TEXT_SAMPLE_RATE,
	TIMESCALE_48000,
	VIDEO_SAMPLE_RATE,
	ZERO,
} from '../../../utils/constants.js';

/**
 * This function tries to recreate the timescale value.
 *
 * This value is not stored on the ham object, so it is not possible (for now)
 * to get the original one.
 *
 * Just the audio tracks have this value stored on the `sampleRate` key.
 *
 * @param track - Track to get the timescale from
 * @returns Timescale in numbers
 */
function getTimescale(track: Track): number {
	if (track.type === 'audio') {
		const audioTrack = track as AudioTrack;
		return audioTrack.sampleRate !== 0
			? audioTrack.sampleRate
			: TIMESCALE_48000;
	}
	if (track.type === 'video') {
		return VIDEO_SAMPLE_RATE;
	}
	if (track.type === 'text') {
		return TEXT_SAMPLE_RATE;
	}
	return VIDEO_SAMPLE_RATE;
}

function getFrameRate(track: Track): string | undefined {
	let frameRate: string | undefined = undefined;
	const videoTrack = track as VideoTrack;
	if (track.type === 'video') {
		frameRate = `${videoTrack.frameRate.frameRateNumerator}`;
		frameRate =
			videoTrack.frameRate.frameRateDenominator !== ZERO
				? `${frameRate}/${videoTrack.frameRate.frameRateDenominator}`
				: frameRate;
	}

	return frameRate;
}

export { getTimescale, getFrameRate };
