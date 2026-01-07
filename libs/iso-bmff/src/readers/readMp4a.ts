import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readAudioSampleEntryBox } from './readAudioSampleEntryBox.ts'

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 * @public
 */
export function readMp4a(view: IsoBoxReadView): AudioSampleEntryBox<'mp4a'> {
	return readAudioSampleEntryBox('mp4a', view)
};
