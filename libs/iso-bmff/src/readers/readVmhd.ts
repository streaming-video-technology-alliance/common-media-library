import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint16 } from '../cursor/readUint16.ts'

/**
 * Read the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VideoMediaHeaderBox`
 *
 * @public
 */
export function readVmhd(cursor: IsoBoxReadCursor<IsoInt64>): VideoMediaHeaderBox {
	return {
		type: 'vmhd',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		graphicsMode: readUint16(cursor),
		opColor: [readUint16(cursor), readUint16(cursor), readUint16(cursor)],
	}
}
