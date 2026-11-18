import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readAudioSampleEntry } from './readAudioSampleEntry.ts'

/**
 * Read the `enca` box (`AudioSampleEntry`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioSampleEntry`
 *
 * @public
 */
export function readEnca(view: IsoBoxReadView<IsoInt64>): AudioSampleEntry<'enca'> {
	return readAudioSampleEntry('enca', view)
}
