import type {
	SchemeInformationBox,
	SchemeInformationBoxChild,
} from '../boxes/SchemeInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `schi` box (`SchemeInformationBox`).
 *
 * The `readers` map does not need an entry for the `schi` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SchemeInformationBox`
 *
 * @public
 */
export function readSchi(cursor: IsoBoxReadCursor<IsoInt64>): SchemeInformationBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'schi',
		boxes: view.readBoxes<SchemeInformationBoxChild>(),
	}
}
