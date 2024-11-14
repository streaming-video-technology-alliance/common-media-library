import type { BoxParser } from '../BoxParser.js';
import { type TypeBox } from '../TypeBox.js';
import { ftyp } from './ftyp.js';

/**
 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SegmentTypeBox = TypeBox;

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
export const styp: BoxParser<SegmentTypeBox> = ftyp;
