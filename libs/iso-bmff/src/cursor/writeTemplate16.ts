import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeUint16 } from './writeUint16.ts'

/**
 * Writes a fixed-point value of 2 bytes (8.8): 1 byte for the integer part and 1 byte for the fraction. A negative value is stored as a two's complement number.
 *
 * @param cursor - The cursor to write to. The function moves the cursor past the field.
 * @param value - The value to write.
 *
 * @example
 * {@includeCode ../../test/writeFields.test.ts#example}
 *
 * @public
 */
export function writeTemplate16(cursor: IsoBoxWriteCursor, value: number): void {
	writeUint16(cursor, Math.round(value * 0x100))
}
