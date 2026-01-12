import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an `AudioRenderingIndicationBox` to an `IsoBoxWriteView`.
 *
 * @param box - The `AudioRenderingIndicationBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeArdi(box: AudioRenderingIndicationBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const audioRenderingIndicationSize = 1
	const totalSize = headerSize + fullBoxSize + audioRenderingIndicationSize

	const writer = new IsoBoxWriteView('ardi', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.audioRenderingIndication, 1)

	return writer
}
