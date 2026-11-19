import type { KindBox } from '../boxes/KindBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `kind` box (`KindBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `KindBox`
 *
 * @public
 */
export function readKind(cursor: IsoBoxReadCursor<IsoInt64>): KindBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'kind',
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	}
}
