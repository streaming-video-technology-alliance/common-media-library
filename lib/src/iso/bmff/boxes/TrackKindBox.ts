import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackKindBox = FullBox & {
	type: 'kind';
	schemeUri: string;
	value: string;
};
