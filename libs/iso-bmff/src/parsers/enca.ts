import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.js';
import type { Fields } from '../boxes/Fields.js';
import type { IsoView } from '../IsoView.js';
import { mp4a } from './mp4a.js';

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 *
 * @beta
 */
export function enca(view: IsoView): Fields<AudioSampleEntryBox<'enca'>> {
	return mp4a(view);
}
