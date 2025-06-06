import type { IsoView } from './IsoView.js';

/**
 * Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Box<T = any> = T & {
	type: string;
	size: number;
	data?: IsoView;
	largesize?: number;
	usertype?: number[];
	boxes?: Box[];
};
