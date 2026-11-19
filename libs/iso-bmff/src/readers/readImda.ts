import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `imda` box (`IdentifiedMediaDataBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `IdentifiedMediaDataBox`
 *
 * @public
 */
export function readImda(cursor: IsoBoxReadCursor<IsoInt64>): IdentifiedMediaDataBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'imda',
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	}
}
