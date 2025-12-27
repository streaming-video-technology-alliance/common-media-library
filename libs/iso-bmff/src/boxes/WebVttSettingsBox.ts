import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
 *
 * @public
 */
export type WebVttSettingsBox = Box & {
	type: 'sttg';
	settings: string;
};
