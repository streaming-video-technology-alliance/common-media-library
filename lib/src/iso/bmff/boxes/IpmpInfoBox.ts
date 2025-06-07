import type { FullBox } from './FullBox.js';

/**
 * IPMP Info Box - 'imif'
 */
export type IpmpInfoBox = FullBox & {
	type: 'imif';
	ipmpDescr: any[];
};
