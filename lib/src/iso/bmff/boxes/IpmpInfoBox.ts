import type { FullBox } from './FullBox.js';

/**
 * IPMP Info Box - 'imif'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IpmpInfoBox = FullBox & {
	type: 'imif';
	ipmpDescr: any[];
};
