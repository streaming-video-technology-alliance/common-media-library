import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readAudioSampleEntryBox } from './readAudioSampleEntryBox.ts'

/**
 * Read the `mp4a` box (`AudioSampleEntryBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioSampleEntryBox`
 *
 * @public
 */
export function readMp4a(view: IsoBoxReadView<IsoInt64>): AudioSampleEntryBox<'mp4a'> {
	return readAudioSampleEntryBox('mp4a', view)
}
