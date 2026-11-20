import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `url ` box (`DataEntryUrlBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `DataEntryUrlBox`
 *
 * @example
 * {@includeCode ../../test/readers/readUrl.test.ts#example}
 *
 * @public
 */
export function readUrl(cursor: IsoBoxReadCursor<IsoInt64>): DataEntryUrlBox {
	return {
		type: 'url ',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		location: cursor.pos < cursor.end ? readTerminatedUtf8(cursor) : undefined,
	}
}
