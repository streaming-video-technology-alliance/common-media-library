import { encodeText } from '@svta/cml-utils'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a WebVttConfigurationBox to an IsoDataWriter.
 *
 * @param box - The WebVttConfigurationBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeVttC(box: WebVttConfigurationBox): IsoDataWriter {
	const configBytes = encodeText(box.config)

	const headerSize = 8
	const configSize = configBytes.length
	const totalSize = headerSize + configSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('vttC', totalSize)
	writer.writeBytes(configBytes)

	return writer
}
