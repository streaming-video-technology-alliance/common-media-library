import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
 *
 *
 * @beta
 */
export type WebVttSettingsBox = Box<'sttg'> & {
	settings: string;
};
