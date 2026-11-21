import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `urn ` box (`DataEntryUrnBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `DataEntryUrnBox`
 *
 * @example
 * {@includeCode ../../test/readers/readUrn.test.ts#example}
 *
 * @public
 */
export function readUrn(cursor: IsoBoxReadCursor<IsoInt64>): DataEntryUrnBox {
	return {
		type: 'urn ',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		name: readTerminatedUtf8(cursor),
		location: cursor.pos < cursor.end ? readTerminatedUtf8(cursor) : undefined,
	}
}
