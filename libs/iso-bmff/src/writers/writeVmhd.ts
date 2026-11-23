import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `VideoMediaHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeVmhd(cursor: IsoBoxWriteCursor, box: VideoMediaHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'vmhd', box.version, box.flags)

	writeUint16(cursor, box.graphicsMode)

	for (let i = 0; i < 3; i++) {
		writeUint16(cursor, box.opColor[i])
	}

	endIsoBox(cursor, start)
}
