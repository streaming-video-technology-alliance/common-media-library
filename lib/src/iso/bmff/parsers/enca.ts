import type { BoxParser } from '../BoxParser.js';
import { mp4a, type AudioSampleEntry } from './mp4a.js';

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export const enca: BoxParser<AudioSampleEntry> = mp4a;
