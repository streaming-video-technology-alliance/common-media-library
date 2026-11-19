import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sttg` box (`WebVttSettingsBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttSettingsBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeSttg.test.ts#example}
 *
 * @public
 */
export function writeSttg(cursor: IsoBoxWriteCursor, box: WebVttSettingsBox): void {
	const settingsBytes = encodeText(box.settings)

	const headerSize = 8
	const settingsSize = settingsBytes.length
	const totalSize = headerSize + settingsSize

	const writer = new IsoBoxWriteView('sttg', totalSize)
	writer.writeBytes(settingsBytes)

	writeLegacyView(cursor, writer)
}
