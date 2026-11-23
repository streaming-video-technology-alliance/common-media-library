import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeUint32 } from './writeUint32.ts'

/**
 * Writes a fixed-point value of 4 bytes (16.16): 2 bytes for the integer part and 2 bytes for the fraction. The field is unsigned.
 * The function rounds the value to the nearest value of the field.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @throws RangeError if the rounded value does not fit the field. The error is the error of `writeUint32`, with the value in units of the field. The cursor does not move.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeTemplate32(cursor: IsoBoxWriteCursor, value: number): void {
	writeUint32(cursor, Math.round(value * 0x10000))
}
