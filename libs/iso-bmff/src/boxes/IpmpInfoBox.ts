import type { FullBox } from './FullBox.ts'

/**
 * IPMP Info Box - 'imif'
 *
 * @public
 */
export type IpmpInfoBox = FullBox & {
	type: 'imif';
	ipmpDescr: any[];
};
