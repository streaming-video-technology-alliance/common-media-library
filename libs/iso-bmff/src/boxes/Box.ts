import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Base Box Type
 *
 * @public
 */
export type Box<T extends IsoBoxType = never> = {
	type: T;
	size: number;
	view: IsoBoxReadView;
	largesize?: number;
	usertype?: number[];
};
