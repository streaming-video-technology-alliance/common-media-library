import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
 *
 *
 * @beta
 */
export type WebVttSettingsBox = Box & {
	type: 'sttg';
	settings: string;
};
