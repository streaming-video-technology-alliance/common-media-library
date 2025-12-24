import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a SchemeTypeBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 *
 * @param box - The SchemeTypeBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeSchm(box: SchemeTypeBox): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const schemeTypeSize = 4
	const schemeVersionSize = 4
	const schemeUriSize = (box.flags & 0x000001) && box.schemeUri ? box.schemeUri.length + 1 : 0
	const totalSize = headerSize + fullBoxSize + schemeTypeSize + schemeVersionSize + schemeUriSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('schm', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.schemeType, 4)
	writer.writeUint(box.schemeVersion, 4)

	if ((box.flags & 0x000001) && box.schemeUri) {
		writer.writeTerminatedString(box.schemeUri)
	}

	return writer
}
