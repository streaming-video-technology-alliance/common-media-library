import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { reserve } from './reserve.ts'

/**
 * Writes an unsigned integer of 8 bytes from a `bigint`.
 *
 * The function needs the `setBigUint64` method of `DataView`.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write, from 0 to 2^64 - 1.
 *
 * @throws RangeError if `value` is negative or greater than 2^64 - 1. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeUint64(cursor: IsoBoxWriteCursor, value: bigint): void {
	if (BigInt.asUintN(64, value) !== value) {
		throw new RangeError(`writeUint64: value must be in the range 0 to 2^64 - 1, received ${value}`)
	}

	const pos = reserve(cursor, 8)

	cursor.view.setBigUint64(pos, value)
}
