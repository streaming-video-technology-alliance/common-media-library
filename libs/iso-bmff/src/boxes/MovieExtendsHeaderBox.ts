import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 *
 * @beta
 */
export type MovieExtendsHeaderBox = FullBox & {
	type: 'mehd';
	fragmentDuration: number;
};
