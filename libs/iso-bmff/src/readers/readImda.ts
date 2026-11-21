import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readBytes } from '../cursor/readBytes.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `imda` box (`IdentifiedMediaDataBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `IdentifiedMediaDataBox`
 *
 * @public
 */
export function readImda(cursor: IsoBoxReadCursor<IsoInt64>): IdentifiedMediaDataBox {
	return {
		type: 'imda',
		imdaIdentifier: readUint32(cursor),
		data: readBytes(cursor, cursor.end - cursor.pos),
	}
}
