import { Segment } from './Segment.js';
import { Ham } from './Ham';

type Track = Ham & {
	id: string;
	type: string;
	name: string;
	codec: string;
	duration: number;
	language: string;
	bandwidth: number;
	segments: Segment[];
};

type AudioTrack = Track & {
	sampleRate: number;
	channels: number;
};

type TextTrack = Track;

type VideoTrack = Track & {
	width: number;
	height: number;
	frameRate: number;
	par: string;
	sar: string;
	scanType: string;
};

export type { Track, VideoTrack, AudioTrack, TextTrack };
