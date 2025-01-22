import type { BoxParser } from '../BoxParser.js';
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
export const avc2: BoxParser<VisualSampleEntry> = avc1;
