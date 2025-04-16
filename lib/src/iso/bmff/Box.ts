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
	largesize?: number;
	usertype?: number[];
	boxes?: Box[];
};
