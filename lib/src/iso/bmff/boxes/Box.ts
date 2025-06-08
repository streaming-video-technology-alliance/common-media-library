import type { IsoView } from '../IsoView.js';

/**
 * Base Box Type
 *
 * @group ISOBMFF
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
