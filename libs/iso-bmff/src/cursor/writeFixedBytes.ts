import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failRange } from './failRange.ts'
import { writeBytes } from './writeBytes.ts'

/**
 * Writes a byte field with a fixed size.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param data - The bytes to write.
 * @param size - The size of the field in bytes.
 * @param name - The box field, for the error message.
 *
 * @throws RangeError if `data` does not have `size` bytes. The cursor does not move.
 *
 * @internal
 */
export function writeFixedBytes(
	cursor: IsoBoxWriteCursor,
	data: ArrayLike<number>,
	size: number,
	name: string,
): void {
	if (data?.length !== size) {
		failRange(name, size + ' bytes', data)
	}

	writeBytes(cursor, data)
}
