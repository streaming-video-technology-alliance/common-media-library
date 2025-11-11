import { Box } from '../data/Box.ts'
import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Writes a box header (size + type) to a DataView
 *
 * @param box - The Box instance
 * @param dataView - The DataView to write to
 * @param offset - The offset in the DataView to start writing
 * @param payloadSize - The size of the box payload (excluding header)
 * @returns The number of bytes written (8 for header)
 */
export function writeBoxHeader(box: Box, dataView: DataView, offset: number): number {
	let cursor = offset

	// Calculate box size: 8 (header) + payload
	const boxSize = 8 + box.size

	// Write box size (4 bytes)
	writeUint(dataView, cursor, 4, boxSize)
	cursor += 4

	// Write box type (4 bytes)
	writeString(dataView, cursor, box.type)
	cursor += 4

	return cursor - offset
}

