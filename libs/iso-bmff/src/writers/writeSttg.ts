import { encodeText } from '@svta/cml-utils'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `WebVttSettingsBox` to an `IsoBoxWriteView`.
 *
 * @param box - The `WebVttSettingsBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeSttg(box: WebVttSettingsBox): IsoBoxWriteView {
	const settingsBytes = encodeText(box.settings)

	const headerSize = 8
	const settingsSize = settingsBytes.length + 1 // null-terminated
	const totalSize = headerSize + settingsSize

	const writer = new IsoBoxWriteView('sttg', totalSize)
	writer.writeUtf8TerminatedString(box.settings)

	return writer
}
