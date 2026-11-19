import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeUint8 } from './writeUint8.ts'

/**
 * Writes a byte field with a fixed size. The function writes 0 for each missing byte and ignores extra bytes.
 *
 * @internal
 */
export function writeFixedBytes(
	cursor: IsoBoxWriteCursor,
	data: ArrayLike<number>,
	size: number,
): void {
	for (let i = 0; i < size; i++) {
		writeUint8(cursor, data[i] ?? 0)
	}
}
