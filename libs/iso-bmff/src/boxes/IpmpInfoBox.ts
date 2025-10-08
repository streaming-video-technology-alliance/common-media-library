import type { FullBox } from './FullBox.js';

/**
 * IPMP Info Box - 'imif'
 *
 *
 * @beta
 */
export type IpmpInfoBox = FullBox & {
	type: 'imif';
	ipmpDescr: any[];
};
