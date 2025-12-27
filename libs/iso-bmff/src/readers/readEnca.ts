import type { AudioSampleEntryBox } from '../boxes/types/AudioSampleEntryBox.ts'
import type { Fields } from '../boxes/types/Fields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readMp4a } from './readMp4a.ts'

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 * @public
 */
export function readEnca(view: IsoBoxReadView): Fields<AudioSampleEntryBox<'enca'>> {
	return readMp4a(view)
}
