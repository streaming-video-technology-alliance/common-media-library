import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sthd` box (`SubtitleMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubtitleMediaHeaderBox`
 *
 * @public
 */
export function readSthd(cursor: IsoBoxReadCursor<IsoInt64>): SubtitleMediaHeaderBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'sthd',
		...view.readFullBox(),
	}
}
