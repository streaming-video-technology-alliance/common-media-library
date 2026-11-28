import type { HandlerBox } from '../boxes/HandlerBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readFourCc } from '../cursor/readFourCc.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

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
	return {
		type: 'hdlr',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		preDefined: readUint32(cursor),
		handlerType: readFourCc(cursor),
		reserved: [readUint32(cursor), readUint32(cursor), readUint32(cursor)],
		name: readTerminatedUtf8(cursor),
	}
}
