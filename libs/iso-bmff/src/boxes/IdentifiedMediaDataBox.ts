/**
 * ISO/IEC 14496-12:2012 - 9.1.4.1 Identified media data box
 *
 * @public
 */
export type IdentifiedMediaDataBox = {
	type: 'imda';
	imdaIdentifier: number;
	data: Uint8Array;
};
