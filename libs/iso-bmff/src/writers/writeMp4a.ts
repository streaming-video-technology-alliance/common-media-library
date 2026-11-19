import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import { writeAudioSampleEntry } from './writeAudioSampleEntry.ts'

/**
 * Write the `mp4a` box (`AudioSampleEntry`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * @param cursor - The write cursor
 * @param box - The `AudioSampleEntry` fields to write
 *
 * @public
 */
export function writeMp4a(cursor: IsoBoxWriteCursor, box: AudioSampleEntry<'mp4a'>): void {
	writeAudioSampleEntry(cursor, box)
}
