import type { Track } from './Track.js';

type VideoTrack = Track & {
	width: number;
	height: number;
	frameRate: FrameRate;
	par: string;
	sar: string;
	scanType: string;
};

/**
 * @internal
 *
 * Video Frame Rate
 */
type FrameRate = {
	frameRateNumerator: number;
	frameRateDenominator?: number;
};


export type { VideoTrack, FrameRate };
