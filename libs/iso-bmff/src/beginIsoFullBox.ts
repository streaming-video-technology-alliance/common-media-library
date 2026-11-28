import { beginIsoBox } from './beginIsoBox.ts'
import { writeUint24 } from './cursor/writeUint24.ts'
import { writeUint8 } from './cursor/writeUint8.ts'
import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'

/**
 * Writes a full box header with no size: the header, the version, and the flags. `endIsoBox` writes the size.
 *
 * @param cursor - The cursor to write to.
 * @param type - The four-character code of the box.
 * @param version - The version of the box.
 * @param flags - The flags of the box.
 * @returns The position of the first byte of the box. Pass it to `endIsoBox`.
 *
 * @throws RangeError if `type` does not have 4 characters of 1 byte each, or `version` or `flags` does not fit its field.
 *
 * @example
 * {@includeCode ../test/beginIsoBox.test.ts#example}
 *
 * @public
 */
export function beginIsoFullBox(
	cursor: IsoBoxWriteCursor,
	type: string,
	version: number,
	flags: number,
): number {
	const start = beginIsoBox(cursor, type)

	writeUint8(cursor, version)
	writeUint24(cursor, flags)

	return start
}
