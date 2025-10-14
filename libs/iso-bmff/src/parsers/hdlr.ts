import type { Fields } from '../boxes/Fields.ts';
import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts';
import { UINT } from '../fields/UINT.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a HandlerReferenceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed HandlerReferenceBox
 *
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
