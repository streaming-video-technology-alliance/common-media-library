import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Base Box Type
 *
 * @public
 */
export type Box = {
	type: ''; // NOTE: no type means the box is not parsed
	size: number;
	view: IsoBoxReadView;
	largesize?: number;
	usertype?: number[];
};
