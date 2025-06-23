import type { Fields } from '../boxes/Fields.js';
import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.js';
import type { IsoView } from '../IsoView.js';
import { ftyp } from './ftyp.js';

/**
 * Parse a SegmentTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SegmentTypeBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function styp(view: IsoView): Fields<SegmentTypeBox> {
	return ftyp(view);
}
