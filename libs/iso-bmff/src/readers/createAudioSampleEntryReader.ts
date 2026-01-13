import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readAudioSampleEntryBox } from './readAudioSampleEntryBox.ts'

/**
 * Creates a reader function for `AudioSampleEntryBox` with a custom type.
 *
 * This utility allows reading audio sample entry boxes with types that
 * aren't in the standard `AudioSampleEntryType` union (e.g., `'mp4a'`, `'enca'`).
 *
 * @param type - The 4-character box type
 *
 * @returns A reader function that can be passed to `readIsoBoxes`
 *
 * @example
 * ```ts
 * const boxes = readIsoBoxes(data, {
 *   readers: {
 *     'ac-3': createAudioSampleEntryReader('ac-3'),
 *     'ec-3': createAudioSampleEntryReader('ec-3'),
 *   }
 * })
 * ```
 *
 * @public
 */
export function createAudioSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView) => AudioSampleEntryBox<T> {
	return (view: IsoBoxReadView) => readAudioSampleEntryBox<T>(type, view)
}
