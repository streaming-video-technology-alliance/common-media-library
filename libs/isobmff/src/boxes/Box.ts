import type { IsoView } from '../IsoView.js';

/**
 * Base Box Type
 *
 *
 * @beta
 */
export type Box = {
	type: string;
	size: number;
	view: IsoView;
	largesize?: number;
	usertype?: number[];
};
