import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readAudioSampleEntry } from './readAudioSampleEntry.ts'

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
): (cursor: IsoBoxReadCursor<IsoInt64>) => AudioSampleEntry<T> {
	return (cursor: IsoBoxReadCursor<IsoInt64>) => readAudioSampleEntry<T>(type, cursor)
}
