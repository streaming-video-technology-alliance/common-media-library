import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readInt32 } from './readInt32.ts'
import { readUint32 } from './readUint32.ts'

/**
 * Reads an integer field of 4 or 8 bytes as a `number`.
 * A field of 8 bytes loses precision outside the safe integer range.
 *
 * @param cursor - The cursor to read from.
 * @param size - The size of the field in bytes.
 * @param signed - Whether the field is a signed integer.
 * @returns The value of the field.
 *
 * @internal
 */
export function readWideNumber(
	cursor: IsoBoxReadCursor<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
): number {
	const value = signed ? readInt32(cursor) : readUint32(cursor)

	return size === 8 ? value * 0x100000000 + readUint32(cursor) : value
}
