import type { BoxParser } from '../BoxParser.js';
import { free, type FreeSpaceBox } from './free.js';

/**
 * Parse a FreeSpaceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FreeSpaceBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export const skip: BoxParser<FreeSpaceBox> = free;
