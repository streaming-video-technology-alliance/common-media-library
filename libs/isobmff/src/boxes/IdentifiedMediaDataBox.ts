import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-12:2012 - 9.1.4.1 Identified media data box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IdentifiedMediaDataBox = Box & {
	type: 'imda';
	imdaIdentifier: number;
	data: Uint8Array;
};
