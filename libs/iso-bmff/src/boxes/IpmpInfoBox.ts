import type { FullBox } from './FullBox.ts';

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
