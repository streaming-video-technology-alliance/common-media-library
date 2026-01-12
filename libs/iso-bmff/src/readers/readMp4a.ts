import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readAudioSampleEntryBox } from './readAudioSampleEntryBox.ts'

/**
 * Parse an `AudioSampleEntryBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioSampleEntryBox`
 *
 * @public
 */
export function readMp4a(view: IsoBoxReadView): AudioSampleEntryBox<'mp4a'> {
	return readAudioSampleEntryBox('mp4a', view)
};
