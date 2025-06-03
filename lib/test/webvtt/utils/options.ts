import type { WebVttCue } from '@svta/common-media-library/webvtt/WebVttCue.js';
import type { WebVttRegion } from '@svta/common-media-library/webvtt/WebVttRegion.js';

export const options = {
	createCue: () => ({} as WebVttCue),
	createRegion: () => ({} as WebVttRegion),
};
