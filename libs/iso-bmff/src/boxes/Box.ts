import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Base Box Type
 *
 * @public
 */
export type Box = {
	// TODO: This is a hack to get type discrimination to work
	type: '';
	size: number;
	view: IsoBoxReadView;
	largesize?: number;
	usertype?: number[];
};
