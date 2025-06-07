import type { IsoView } from '../IsoView.js';

/**
 * Base Box Type
 */
export type Box = {
	type: string;
	size: number;
	data?: IsoView;
	largesize?: number;
	usertype?: number[];
};
