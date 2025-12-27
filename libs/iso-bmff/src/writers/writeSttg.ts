import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/types/Fields.ts'
import type { WebVttSettingsBox } from '../boxes/types/WebVttSettingsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttSettingsBox to an IsoDataWriter.
 *
 * @param box - The WebVttSettingsBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSttg(box: Fields<WebVttSettingsBox>): IsoBoxWriteView {
	const settingsBytes = encodeText(box.settings)

	const headerSize = 8
	const settingsSize = settingsBytes.length + 1 // null-terminated
	const totalSize = headerSize + settingsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('sttg', totalSize)
	writer.writeUtf8TerminatedString(box.settings)

	return writer
}
