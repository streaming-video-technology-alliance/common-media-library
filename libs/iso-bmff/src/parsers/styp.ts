import type { Fields } from '../boxes/Fields.ts';
import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts';
import type { IsoView } from '../IsoView.ts';
import { ftyp } from './ftyp.ts';

/**
 * Parse a SegmentTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SegmentTypeBox
 *
 *
 * @beta
 */
export function styp(view: IsoView): Fields<SegmentTypeBox> {
	return ftyp(view);
}
