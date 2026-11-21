import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readInt16 } from '../cursor/readInt16.ts'

/**
 * Read the `smhd` box (`SoundMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SoundMediaHeaderBox`
 *
 * @public
 */
export function readSmhd(cursor: IsoBoxReadCursor<IsoInt64>): SoundMediaHeaderBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const balance = readInt16(cursor) / 0x100

	cursor.pos += 2

	return {
		type: 'smhd',
		version,
		flags,
		balance,
	}
}
