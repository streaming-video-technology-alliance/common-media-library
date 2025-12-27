import type { Fields } from '../boxes/types/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/types/VisualSampleEntryBox.ts'
import type { VisualSampleEntryType } from '../boxes/types/VisualSampleEntryType.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a VisualSampleEntryBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.1.3 Visual Sample Entry
 *
 * @param box - The VisualSampleEntryBox fields to write
 * @param type - The box type
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeVisualSampleEntryBox<T extends VisualSampleEntryType>(box: Fields<VisualSampleEntryBox<T>>, type: T): IsoBoxWriteView {
	const headerSize = 8
	const reserved1Size = 6
	const dataReferenceIndexSize = 2
	const preDefined1Size = 2
	const reserved2Size = 2
	const preDefined2Size = 12 // 3 x 4 bytes
	const widthSize = 2
	const heightSize = 2
	const horizresolutionSize = 4
	const vertresolutionSize = 4
	const reserved3Size = 4
	const frameCountSize = 2
	const compressorNameSize = 32
	const depthSize = 2
	const preDefined3Size = 2
	const configSize = box.config.length
	const totalSize = headerSize + reserved1Size + dataReferenceIndexSize + preDefined1Size +
		reserved2Size + preDefined2Size + widthSize + heightSize + horizresolutionSize +
		vertresolutionSize + reserved3Size + frameCountSize + compressorNameSize +
		depthSize + preDefined3Size + configSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader(type, totalSize)

	for (let i = 0; i < 6; i++) {
		writer.writeUint(box.reserved1[i] ?? 0, 1)
	}

	writer.writeUint(box.dataReferenceIndex, 2)
	writer.writeUint(box.preDefined1, 2)
	writer.writeUint(box.reserved2, 2)

	for (let i = 0; i < 3; i++) {
		writer.writeUint(box.preDefined2[i] ?? 0, 4)
	}

	writer.writeUint(box.width, 2)
	writer.writeUint(box.height, 2)
	writer.writeTemplate(box.horizresolution, 4)
	writer.writeTemplate(box.vertresolution, 4)
	writer.writeUint(box.reserved3, 4)
	writer.writeUint(box.frameCount, 2)

	for (let i = 0; i < 32; i++) {
		writer.writeUint(box.compressorName[i] ?? 0, 1)
	}

	writer.writeUint(box.depth, 2)
	writer.writeUint(box.preDefined3 & 0xFFFF, 2)
	writer.writeBytes(box.config)

	return writer
}
