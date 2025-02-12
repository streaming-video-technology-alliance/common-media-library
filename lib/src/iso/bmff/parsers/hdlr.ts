import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type HandlerReferenceBox = {
	preDefined: number;
	handlerType: string;
	reserved: number[];
	name: string;
};

/**
 * Parse a HandlerReferenceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed HandlerReferenceBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function hdlr(view: IsoView): HandlerReferenceBox {
	return {
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readString(-1),
	};
};
