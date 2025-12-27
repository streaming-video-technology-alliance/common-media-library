import type { Fields } from '../boxes/types/Fields.ts'
import type { SegmentTypeBox } from '../boxes/types/SegmentTypeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readFtyp } from './readFtyp.ts'

/**
 * Parse a SegmentTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SegmentTypeBox
 *
 * @public
 */
export function readStyp(view: IsoBoxReadView): Fields<SegmentTypeBox> {
	return readFtyp(view)
}
