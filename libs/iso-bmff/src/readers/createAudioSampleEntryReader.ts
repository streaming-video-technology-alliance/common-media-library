import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readAudioSampleEntryBox } from './readAudioSampleEntryBox.ts'

/**
 * Create a reader for an audio sample entry box of a type that `AudioSampleEntryType` does not list, such as `ac-3` or `ec-3`.
 *
 * @param type - The 4-character box type
 *
 * @returns A reader function that can be passed to `readIsoBoxes`
 *
 * @example
 * {@includeCode ../../test/readers/createAudioSampleEntryReader.test.ts#example}
 *
 * @public
 */
export function createAudioSampleEntryReader<T extends IsoBoxType>(
	type: T,
): (view: IsoBoxReadView<IsoInt64>) => AudioSampleEntryBox<T> {
	return (view: IsoBoxReadView<IsoInt64>) => readAudioSampleEntryBox<T>(type, view)
}
