import type { IsoView } from '../IsoView.ts';
import { avc1, type VisualSampleEntry } from './avc1.ts';

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function hvc1(view: IsoView): VisualSampleEntry {
	return avc1(view);
}
