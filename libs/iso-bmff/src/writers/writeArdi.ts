import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `ardi` box (`AudioRenderingIndicationBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `AudioRenderingIndicationBox` fields to write
 *
 * @public
 */
export function writeArdi(cursor: IsoBoxWriteCursor, box: AudioRenderingIndicationBox): void {
	const start = beginIsoFullBox(cursor, 'ardi', box.version, box.flags)

	writeUint8(cursor, box.audioRenderingIndication)
	endIsoBox(cursor, start)
}
