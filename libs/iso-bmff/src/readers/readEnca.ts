import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readAudioSampleEntry } from './readAudioSampleEntry.ts'

/**
 * Read the `enca` box (`AudioSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `AudioSampleEntry`
 *
 * @public
 */
export function readEnca(cursor: IsoBoxReadCursor<IsoInt64>): AudioSampleEntry<'enca'> {
	return readAudioSampleEntry('enca', cursor)
}
