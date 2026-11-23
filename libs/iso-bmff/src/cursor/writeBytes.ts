import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failInteger } from './failInteger.ts'
import { failRange } from './failRange.ts'
import { reserve } from './reserve.ts'

/**
 * Writes a number of bytes.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the bytes.
 * @param data - The bytes to write, such as a `Uint8Array` or an array of numbers.
 *
 * @throws RangeError if `data` has no length, or an item is not an integer from 0 to 255. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#writeBytes}
 *
 * @public
 */
export function writeBytes(cursor: IsoBoxWriteCursor, data: ArrayLike<number>): void {
	const length = data?.length

	if (!(length >= 0) || length % 1) {
		failRange('writeBytes: data', 'a Uint8Array or an array of numbers', data)
	}

	if (!(data instanceof Uint8Array)) {
		for (let i = 0; i < length; i++) {
			if ((data[i] & 0xff) !== data[i]) {
				failInteger('writeBytes: value', data[i], 0, 0xff)
			}
		}
	}

	const pos = reserve(cursor, length)
	cursor.bytes.set(data, pos)
}
