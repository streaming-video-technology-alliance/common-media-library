import { encodeText } from '@svta/cml-utils'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sttg` box (`WebVttSettingsBox`).
 *
 * @param box - The `WebVttSettingsBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeSttg(box: WebVttSettingsBox): IsoBoxWriteView {
	const settingsBytes = encodeText(box.settings)

	const headerSize = 8
	const settingsSize = settingsBytes.length
	const totalSize = headerSize + settingsSize

	const writer = new IsoBoxWriteView('sttg', totalSize)
	writer.writeBytes(settingsBytes)

	return writer
}
