import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vttC` box (`WebVttConfigurationBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttConfigurationBox` fields to write
 *
 * @public
 */
export function writeVttC(cursor: IsoBoxWriteCursor, box: WebVttConfigurationBox): void {
	const configBytes = encodeText(box.config)

	const headerSize = 8
	const configSize = configBytes.length
	const totalSize = headerSize + configSize

	const writer = new IsoBoxWriteView('vttC', totalSize)
	writer.writeBytes(configBytes)

	writeLegacyView(cursor, writer)
}
