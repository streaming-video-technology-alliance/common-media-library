import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVttSettingsBox = Box & {
	type: 'sttg';
	settings: string;
};
