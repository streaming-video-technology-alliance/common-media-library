import { Segment } from './Segment.js';
import { Ham } from './Ham';

/**
 * CMAF-HAM Track type
 * Used as a base for the audio, video and text tracks
 * @param id - The track id
 * @param type - The track type (audio, video, text)
 * @param name - The track name
 * @param codec - The track codec
 * @param duration - The track duration
 * @param language - The track language
 * @param bandwidth - The track bandwidth
 * @param byteRange - The track byte range
 * @param urlInitialization - The track initialization url
 * @param segments - The track segments
 *
 * @group CMAF
 *
 * @alpha
 */
type Track = Ham & {
	id: string;
	type: string;
	name: string;
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
