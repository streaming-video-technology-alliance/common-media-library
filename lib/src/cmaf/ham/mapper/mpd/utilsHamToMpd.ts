import type { AudioTrack, Track } from '../../types/model';

const VIDEO_SAMPLE_RATE = 90000;
const TEXT_SAMPLE_RATE = 1000;

/**
 * This function tries to recreate the timescale value.
 *
 * This value is not stored on the ham object, so it is not possible (for now)
 * to get the original one.
 *
 * Just the audio tracks have this value stored on the `sampleRate` key.
 *
 * Using 90000 as default for video since it is divisible by 24, 25 and 30
 *
 * Using 1000 as default for text
 *
 * @param track Track to get the timescale from
 * @returns Timescale in numbers
 */
function getTimescale(track: Track): number {
	if (track.type === 'audio') {
		const audioTrack = track as AudioTrack;
		return audioTrack.sampleRate;
	}
	if (track.type === 'video') {
		return VIDEO_SAMPLE_RATE;
	}
	if (track.type === 'text') {
		return TEXT_SAMPLE_RATE;
	}
	return VIDEO_SAMPLE_RATE;
}

export { getTimescale };
