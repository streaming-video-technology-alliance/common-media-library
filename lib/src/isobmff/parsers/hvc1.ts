import type { IsoView } from '../IsoView.js';
import { avc1, type VisualSampleEntry } from './avc1.js';

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