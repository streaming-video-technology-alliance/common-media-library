import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { HandlerBox } from '../boxes/HandlerBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `hdlr` box (`HandlerBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.3
 *
 * @param cursor - The write cursor
 * @param box - The `HandlerBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeHdlr.test.ts#example}
 *
 * @public
 */
export function writeHdlr(cursor: IsoBoxWriteCursor, box: HandlerBox): void {
	const nameBytes = encodeText(box.name)

	const headerSize = 8
	const fullBoxSize = 4
	const preDefinedSize = 4
	const handlerTypeSize = 4
	const reservedSize = 12 // 3 x 4 bytes
	const nameSize = nameBytes.length + 1 // null-terminated string
	const totalSize =
		headerSize + fullBoxSize + preDefinedSize + handlerTypeSize + reservedSize + nameSize

	const writer = new IsoBoxWriteView('hdlr', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.preDefined ?? 0, 4)
	writer.writeString(box.handlerType)
	writer.writeArray(box.reserved ?? [], UINT, 4, 3)
	writer.writeBytes(nameBytes)
	writer.writeUint(0, 1)

	writeLegacyView(cursor, writer)
}
