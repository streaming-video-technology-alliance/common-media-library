import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieExtendsHeaderBox = FullBox & {
	type: 'mehd';
	fragmentDuration: number;
};
