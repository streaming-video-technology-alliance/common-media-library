import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `ardi` box (`AudioRenderingIndicationBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `AudioRenderingIndicationBox` fields to write
 *
 * @public
 */
export function writeArdi(cursor: IsoBoxWriteCursor, box: AudioRenderingIndicationBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const audioRenderingIndicationSize = 1
	const totalSize = headerSize + fullBoxSize + audioRenderingIndicationSize

	const writer = new IsoBoxWriteView('ardi', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.audioRenderingIndication, 1)

	writeLegacyView(cursor, writer)
}
