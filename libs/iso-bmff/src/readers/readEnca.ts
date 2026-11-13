import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
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
export function readEnca(view: IsoBoxReadView<IsoInt64>): AudioSampleEntryBox<'enca'> {
	return readAudioSampleEntryBox('enca', view)
}
