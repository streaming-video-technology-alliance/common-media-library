import { Segment, Ham } from './index.js';

/**
 * CMAF-HAM Track type
 * Used as a base for the audio, video and text tracks
 *
 * fileName - File name of the track.
 * codec - Codec of the track.
 * duration - Duration of the track in seconds
 * language - Language of the track.
 * bandwidth - Bandwidth of the track.
 * byteRange - Byte range of the track.
 * segments - List of segments of the track.
 *
 * @group CMAF
 * @alpha
 */

type Track = Ham & {
	/** Track type */
	type: TrackType;
	fileName?: string;
	codec: string;
	duration: number;
	language: string;
	bandwidth: number;
	byteRange?: string;
	/** URL of the initialization segment */
	urlInitialization?: string;
	segments: Segment[];
};



/**
 * CMAF-HAM Audio Track type
 *
 * @group CMAF
 * @alpha
 */
type AudioTrack = Track & {
	sampleRate: number;
	channels: number;
};

/**
 * CMAF-HAM Text Track type
 *
 * @group CMAF
 * @alpha
 */
type TextTrack = Track;

/**
 * CMAF-HAM Video Track type
 *
 * @group CMAF
 * @alpha
 */
type VideoTrack = Track & {
	width: number;
	height: number;
	frameRate: FrameRate;
	par: string;
	sar: string;
	scanType: string;
};

type FrameRate = {
	frameRateNumerator: number;
	frameRateDenominator?: number;
};

type TrackType = 'audio' | 'video' | 'text';

export type { Track, VideoTrack, AudioTrack, TextTrack };
