import { encodeText } from '@svta/cml-utils'
import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `schm` box (`SchemeTypeBox`).
 *
 * When flag `0x000001` is set, the writer writes `schemeUri`, or an empty string for a missing `schemeUri`.
 *
 * ISO/IEC 14496-12:2015 - 8.12.5
 *
 * @param box - The `SchemeTypeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeSchm.test.ts#example}
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
