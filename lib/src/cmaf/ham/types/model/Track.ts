import { Segment } from './Segment.js';
import { Ham } from './Ham';

/**
 * CMAF-HAM Track type
 * Used as a base for the audio, video and text tracks
 *
 * @group CMAF
 *
 * @alpha
 */
type Track = Ham & {
	id: string;
	type: string;
	fileName?: string;
	codec: string;
	duration: number;
	language: string;
	bandwidth: number;
	byteRange?: string;
	urlInitialization?: string;
	segments: Segment[];
};

/**
 * CMAF-HAM Audio Track type
 *
 * @group CMAF
 *
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
 *
 * @alpha
 */
type TextTrack = Track;

/**
 * CMAF-HAM Video Track type
 *
 * @group CMAF
 *
 * @alpha
 */
type VideoTrack = Track & {
	width: number;
	height: number;
	frameRate: string;
	par: string;
	sar: string;
	scanType: string;
};

export type { Track, VideoTrack, AudioTrack, TextTrack };
