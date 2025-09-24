import type { Fields } from '../boxes/Fields.js';
import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

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
export function hdlr(view: IsoView): Fields<HandlerReferenceBox> {
	return {
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readString(-1),
	};
};
