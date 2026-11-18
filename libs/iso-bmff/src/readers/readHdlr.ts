import type { HandlerBox } from '../boxes/HandlerBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `hdlr` box (`HandlerBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `HandlerBox`
 *
 * @example
 * {@includeCode ../../test/readers/readHdlr.test.ts#example}
 *
 * @public
 */
export function readHdlr(view: IsoBoxReadView<IsoInt64>): HandlerBox {
	return {
		type: 'hdlr',
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readUtf8(-1),
	}
}
