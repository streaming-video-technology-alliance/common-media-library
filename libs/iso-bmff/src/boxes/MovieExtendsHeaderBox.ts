import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @public
 */
export type MovieExtendsHeaderBox = FullBox & {
	type: 'mehd';
	fragmentDuration: number;
};

/**
 * @public
 */
export type mehd = MovieExtendsHeaderBox;
