import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 *
 * @beta
 */
export type UrlBox = FullBox & {
	type: 'url';
	location: string;
};
