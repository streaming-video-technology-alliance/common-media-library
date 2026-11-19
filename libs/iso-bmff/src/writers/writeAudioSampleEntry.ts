import { beginIsoBox } from '../beginIsoBox.ts'
import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { AudioSampleEntryType } from '../boxes/AudioSampleEntryType.ts'
import { writeTemplate32 } from '../cursor/writeTemplate32.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write an audio sample entry box (`AudioSampleEntry`) of the type in its `type` field.
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * The writer writes the child boxes with the writers of the cursor.
 *
 * @param cursor - The write cursor
 * @param box - The `AudioSampleEntry` fields to write
 *
 * @public
 */
export function writeAudioSampleEntry<T extends AudioSampleEntryType = AudioSampleEntryType>(
	cursor: IsoBoxWriteCursor,
	box: AudioSampleEntry<T>,
): void {
	const start = beginIsoBox(cursor, box.type)

	writeUint32(cursor, 0) // reserved
	writeUint16(cursor, 0) // reserved
	writeUint16(cursor, box.dataReferenceIndex)
	writeUint16(cursor, box.entryVersion ?? 0)
	writeUint16(cursor, 0) // reserved
	writeUint32(cursor, 0) // reserved
	writeUint16(cursor, box.channelCount)
	writeUint16(cursor, box.sampleSize)
	writeUint16(cursor, box.preDefined ?? 0)
	writeUint16(cursor, 0) // reserved
	writeTemplate32(cursor, box.sampleRate)
	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
