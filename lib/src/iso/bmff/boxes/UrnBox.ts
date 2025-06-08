import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type UrnBox = FullBox & {
	type: 'urn';
	name: string;
	location: string;
};
