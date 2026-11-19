import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readAudioSampleEntry } from './readAudioSampleEntry.ts'

/**
 * Read the `mp4a` box (`AudioSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `AudioSampleEntry`
 *
 * @public
 */
export function readMp4a<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): AudioSampleEntry<'mp4a', V> {
	return readAudioSampleEntry('mp4a', cursor)
}
