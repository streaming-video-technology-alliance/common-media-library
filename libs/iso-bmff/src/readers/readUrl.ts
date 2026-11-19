import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'url ',
		...view.readFullBox(),
		location: view.readUtf8(-1),
	}
}
