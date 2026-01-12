import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readFtyp } from './readFtyp.ts'

/**
 * Parse a `SegmentTypeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SegmentTypeBox`
 *
 * @public
 */
export function readStyp(view: IsoBoxReadView): SegmentTypeBox {
	return {
		...readFtyp(view),
		type: 'styp',
	}
}
