import type { Track } from './Track.js';

/**
 * CMAF-HAM Audio Track type
 *
 * @group CMAF
 * @alpha
 */
export type AudioTrack = Track & {
	sampleRate: number;
	channels: number;
};
