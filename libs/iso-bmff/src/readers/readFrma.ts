import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `frma` box (`OriginalFormatBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `OriginalFormatBox`
 *
 * @public
 */
export function readFrma(cursor: IsoBoxReadCursor<IsoInt64>): OriginalFormatBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'frma',
		dataFormat: view.readUint(4),
	}
}
