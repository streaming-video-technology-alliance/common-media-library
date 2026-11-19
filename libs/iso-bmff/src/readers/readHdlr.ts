import type { HandlerBox } from '../boxes/HandlerBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `hdlr` box (`HandlerBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `HandlerBox`
 *
 * @example
 * {@includeCode ../../test/readers/readHdlr.test.ts#example}
 *
 * @public
 */
export function readHdlr(cursor: IsoBoxReadCursor<IsoInt64>): HandlerBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'hdlr',
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readUtf8(-1),
	}
}
