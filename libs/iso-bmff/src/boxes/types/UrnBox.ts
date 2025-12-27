import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @public
 */
export type UrnBox = FullBox & {
	type: 'urn';
	name: string;
	location: string;
};
