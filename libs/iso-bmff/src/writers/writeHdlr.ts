import { encodeText } from '@svta/cml-utils'
import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `HandlerReferenceBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @param box - The `HandlerReferenceBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeHdlr(box: HandlerReferenceBox): IsoBoxWriteView {
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

	writer.writeUint(box.preDefined, 4)
	writer.writeString(box.handlerType)
	writer.writeArray(box.reserved, UINT, 4, 3)
	writer.writeBytes(nameBytes)
	writer.writeUint(0, 1)

	return writer
}
