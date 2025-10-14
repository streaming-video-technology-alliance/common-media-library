import type { IsoView } from '../IsoView.ts';

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
