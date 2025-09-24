import type { FullBox } from './FullBox.js';

/**
 * Sample Group Description Box - 'sgpd'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleGroupDescriptionBox = FullBox & {
	type: 'sgpd';
	groupingType: number;
	defaultLength?: number;
	entryCount: number;
	entries: any[];
};
