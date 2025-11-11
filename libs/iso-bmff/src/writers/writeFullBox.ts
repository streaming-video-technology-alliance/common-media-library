import { FullBox } from '../data/FullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Writes a FullBox header to a DataView
 *
 * ISO/IEC 14496-12:2012 - 4.2 Object Structure
 *
 * Syntax:
 * aligned(8) class FullBox(unsigned int(32) boxtype, unsigned int(8) v, bit(24) f) extends Box(boxtype) {
 *   unsigned int(8) version;
 *   bit(24) flags;
 * }
 *
 * @param box - The FullBox instance
 * @param dataView - The DataView to write to
 * @param offset - The offset in the DataView to start writing
 * @returns The number of bytes written (8 for box header + 4 for version/flags = 12)
 */
export function writeFullBoxHeader(box: FullBox, dataView: DataView, offset: number): void {
	let cursor = offset

	// Write box type (4 bytes) - already written by base box header
	// This function writes version and flags after the box header
	// Write version (1 byte)
	writeUint(dataView, cursor, 1, box.version)
	cursor += 1

	// Write flags (3 bytes)
	writeUint(dataView, cursor, 3, box.flags)
	cursor += 3
}

