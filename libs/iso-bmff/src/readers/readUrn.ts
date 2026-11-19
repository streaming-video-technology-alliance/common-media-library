import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'urn ',
		...view.readFullBox(),
		name: view.readUtf8(-1),
		location: view.readUtf8(-1),
	}
}
