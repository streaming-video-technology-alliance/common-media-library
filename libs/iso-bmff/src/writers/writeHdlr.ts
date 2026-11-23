import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { HandlerBox } from '../boxes/HandlerBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeFourCc } from '../cursor/writeFourCc.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `hdlr` box (`HandlerBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.3
 *
 * @param cursor - The write cursor
 * @param box - The `HandlerBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 * @throws RangeError if `handlerType` does not have 4 characters.
 *
 * @example
 * {@includeCode ../../test/writers/writeHdlr.test.ts#example}
 *
 * @public
 */
export function writeHdlr(cursor: IsoBoxWriteCursor, box: HandlerBox): void {
	const reserved = box.reserved ?? []
	const start = beginIsoFullBox(cursor, 'hdlr', box.version, box.flags)

	writeUint32(cursor, box.preDefined ?? 0)
	writeFourCc(cursor, box.handlerType)

	for (let i = 0; i < 3; i++) {
		writeUint32(cursor, reserved[i] ?? 0)
	}

	writeTerminatedUtf8(cursor, box.name)
	endIsoBox(cursor, start)
}
