import { encodeText } from '@svta/cml-utils'
import type { KindBox } from '../boxes/KindBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `kind` box (`KindBox`).
 *
 * @param box - The `KindBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeKind.test.ts#example}
 *
 * @public
 */
export function writeKind(box: KindBox): IsoBoxWriteView {
	const schemeUriBytes = encodeText(box.schemeUri)
	const valueBytes = encodeText(box.value)

	const headerSize = 8
	const fullBoxSize = 4
	const schemeUriSize = schemeUriBytes.length + 1 // null-terminated
	const valueSize = valueBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + schemeUriSize + valueSize

	const writer = new IsoBoxWriteView('kind', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeBytes(schemeUriBytes)
	writer.writeUint(0, 1)
	writer.writeBytes(valueBytes)
	writer.writeUint(0, 1)

	return writer
}
