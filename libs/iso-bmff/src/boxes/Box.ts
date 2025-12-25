import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Base Box Type
 *
 *
 * @beta
 */
export type Box = {
	type: string;
	size: number;
	view: IsoBoxReadView;
	largesize?: number;
	usertype?: number[];
};
