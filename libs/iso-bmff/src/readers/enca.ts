import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { mp4a } from './mp4a.ts'

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
export function enca(view: IsoBoxReadView): Fields<AudioSampleEntryBox<'enca'>> {
	return mp4a(view)
}
