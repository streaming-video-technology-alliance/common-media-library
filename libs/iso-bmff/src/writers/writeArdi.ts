import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write an AudioRenderingIndicationBox to an IsoDataWriter.
 *
 * @param box - The AudioRenderingIndicationBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeArdi(box: AudioRenderingIndicationBox): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const audioRenderingIndicationSize = 1
	const totalSize = headerSize + fullBoxSize + audioRenderingIndicationSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('ardi', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.audioRenderingIndication, 1)

	return writer
}
