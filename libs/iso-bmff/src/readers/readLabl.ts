import type { LabelBox } from '../boxes/LabelBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `labl` box (`LabelBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `LabelBox`
 *
 * @public
 */
export function readLabl(cursor: IsoBoxReadCursor<IsoInt64>): LabelBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'labl',
		version,
		flags,
		labelId: view.readUint(2),
		language: view.readUtf8(-1),
		label: view.readUtf8(-1),
	}
}
