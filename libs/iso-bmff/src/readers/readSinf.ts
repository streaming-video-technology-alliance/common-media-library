import type { ProtectionSchemeInfoBox } from '../boxes/ProtectionSchemeInfoBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sinf` box (`ProtectionSchemeInfoBox`).
 *
 * The `readers` map does not need an entry for the `sinf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ProtectionSchemeInfoBox`
 *
 * @public
 */
export function readSinf<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): ProtectionSchemeInfoBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'sinf',
		boxes: view.readBoxes(),
	}
}
