import { encodeText } from '@svta/cml-utils'
import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `SchemeTypeBox` to an `IsoBoxWriteView`.
 *
 * When flag `0x000001` is set, the writer writes `schemeUri`, or an empty string for a missing `schemeUri`.
 *
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 *
 * @param box - The `SchemeTypeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeSchm(box: SchemeTypeBox): IsoBoxWriteView {
	const schemeUriBytes = box.flags & 0x000001 ? encodeText(box.schemeUri ?? '') : undefined

	const headerSize = 8
	const fullBoxSize = 4
	const schemeTypeSize = 4
	const schemeVersionSize = 4
	const schemeUriSize = schemeUriBytes ? schemeUriBytes.length + 1 : 0 // null-terminated
	const totalSize = headerSize + fullBoxSize + schemeTypeSize + schemeVersionSize + schemeUriSize

	const writer = new IsoBoxWriteView('schm', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.schemeType, 4)
	writer.writeUint(box.schemeVersion, 4)

	if (schemeUriBytes) {
		writer.writeBytes(schemeUriBytes)
		writer.writeUint(0, 1)
	}

	return writer
}
