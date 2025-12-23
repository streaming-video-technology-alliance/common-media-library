import { writeUint } from './writeUint.ts'

/**
 * Write a FullBox header (version and flags) to a DataView.
 *
 * @param dataView - The DataView to write to
 * @param offset - The byte offset to write at
 * @param version - The box version (1 byte)
 * @param flags - The box flags (3 bytes)
 *
 * @returns The number of bytes written (always 4)
 *
 * @beta
 */
export function writeFullBox(dataView: DataView, offset: number, version: number, flags: number): number {
	writeUint(dataView, offset, 1, version)
	writeUint(dataView, offset + 1, 3, flags)
	return 4
}

