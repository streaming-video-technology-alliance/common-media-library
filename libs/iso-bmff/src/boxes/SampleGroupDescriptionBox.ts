import type { FullBox } from './FullBox.ts'

/**
 * Sample Group Description Box - 'sgpd'
 *
 * @public
 */
export type SampleGroupDescriptionBox = FullBox & {
	type: 'sgpd';
	groupingType: number;
	defaultLength?: number;
	entryCount: number;
	entries: any[];
};

/**
 * @public
 */
export type sgpd = SampleGroupDescriptionBox;
