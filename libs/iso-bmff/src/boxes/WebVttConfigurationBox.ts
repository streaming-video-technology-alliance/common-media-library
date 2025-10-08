import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Configuration Box
 *
 *
 * @beta
 */
export type WebVttConfigurationBox = Box & {
	type: 'vttC';
	config: string;
};
