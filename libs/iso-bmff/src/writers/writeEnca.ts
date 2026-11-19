import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import { writeAudioSampleEntry } from './writeAudioSampleEntry.ts'

/**
 * Write the `enca` box (`AudioSampleEntry`).
 *
 * @param cursor - The write cursor
 * @param box - The `AudioSampleEntry` fields to write
 *
 * @public
 */
export function writeEnca(
	cursor: IsoBoxWriteCursor,
	box: AudioSampleEntry<'enca', IsoInt64>,
): void {
	writeAudioSampleEntry(cursor, box)
}
