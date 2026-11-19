import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `mdhd` box (`MediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `MediaHeaderBox` fields to write
 *
 * @public
 */
export function writeMdhd(cursor: IsoBoxWriteCursor, box: MediaHeaderBox<IsoInt64>): void {
	const { language } = box
	const size = box.version === 1 ? 8 : 4
	const start = beginIsoFullBox(cursor, 'mdhd', box.version, box.flags)
	let lang = language.length === 3 ? 0 : -1

	for (let i = 0; lang >= 0 && i < 3; i++) {
		const code = language.charCodeAt(i) - 0x60

		lang = code >= 0 && code < 0x20 ? (lang << 5) | code : -1
	}

	writeWideUint(cursor, box.creationTime, size)
	writeWideUint(cursor, box.modificationTime, size)
	writeUint32(cursor, box.timescale)
	writeWideUint(cursor, box.duration, size)
	writeUint16(cursor, lang < 0 ? 0x55c4 : lang)
	writeUint16(cursor, box.preDefined ?? 0)
	endIsoBox(cursor, start)
}
