import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readEntryBoxes } from '../cursor/readEntryBoxes.ts'

/**
 * Read the `stsd` box (`SampleDescriptionBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleDescriptionBox`
 *
 * @public
 */
export function readStsd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SampleDescriptionBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	return {
		type: 'stsd',
		version,
		flags,
		boxes: readEntryBoxes(cursor, 'stsd') as SampleDescriptionBox<V>['boxes'],
	}
}
