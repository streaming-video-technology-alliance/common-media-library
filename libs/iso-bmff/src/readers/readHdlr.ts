import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `HandlerReferenceBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `HandlerReferenceBox`
 *
 * @public
 */
export function readHdlr(view: IsoBoxReadView): HandlerReferenceBox {
	return {
		type: 'hdlr',
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readString(-1),
	}
};
