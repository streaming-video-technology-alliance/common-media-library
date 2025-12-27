import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Configuration Box
 *
 * @public
 */
export type WebVttConfigurationBox = Box & {
	type: 'vttC';
	config: string;
};
