import { encodeText } from '@svta/cml-utils'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttConfigurationBox to an IsoDataWriter.
 *
 * @param box - The WebVttConfigurationBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeVttC(box: WebVttConfigurationBox): IsoBoxWriteView {
	const configBytes = encodeText(box.config)

	const headerSize = 8
	const configSize = configBytes.length
	const totalSize = headerSize + configSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('vttC', totalSize)
	writer.writeBytes(configBytes)

	return writer
}
