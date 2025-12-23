import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a box header (size and type) to a DataView.
 *
 * @param dataView - The DataView to write to
 * @param offset - The byte offset to write at
 * @param type - The 4-character box type
 * @param size - The total box size including header
 * @param largesize - Optional largesize for boxes larger than 2^32 bytes
 *
 * @returns The number of bytes written (8 for normal, 16 for largesize)
 *
 * @beta
 */
export function writeBoxHeader(dataView: DataView, offset: number, type: string, size: number, largesize?: number): number {
	if (largesize !== undefined) {
		writeUint(dataView, offset, 4, 1) // size = 1 indicates largesize follows
		writeString(dataView, offset + 4, type)
		writeUint(dataView, offset + 8, 8, largesize)
		return 16
	}

	writeUint(dataView, offset, 4, size)
	writeString(dataView, offset + 4, type)
	return 8
}

