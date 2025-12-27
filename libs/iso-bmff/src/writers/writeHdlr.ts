import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a HandlerReferenceBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @param box - The HandlerReferenceBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeHdlr(box: HandlerReferenceBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const preDefinedSize = 4
	const handlerTypeSize = 4
	const reservedSize = 12 // 3 x 4 bytes
	const nameSize = box.name.length + 1 // null-terminated string
	const totalSize = headerSize + fullBoxSize + preDefinedSize + handlerTypeSize + reservedSize + nameSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('hdlr', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.preDefined, 4)
	writer.writeString(box.handlerType)

	for (let i = 0; i < 3; i++) {
		writer.writeUint(box.reserved[i] ?? 0, 4)
	}

	writer.writeTerminatedString(box.name)

	return writer
}
