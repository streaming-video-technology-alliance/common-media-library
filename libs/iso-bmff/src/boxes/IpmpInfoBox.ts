import type { FullBox } from './FullBox.ts'

/**
 * IPMP Info Box - 'imif'
 *
 *
 * @beta
 */
export type IpmpInfoBox = FullBox<'imif'> & {
	ipmpDescr: any[];
};
