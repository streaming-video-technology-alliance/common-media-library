import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readTemplate32 } from '../cursor/readTemplate32.ts'
import { readChildBoxes } from '../readChildBoxes.ts'

/**
 * Read an audio sample entry box (`AudioSampleEntry`) of the given type.
 *
 * @param type - The type of `AudioSampleEntry` to read
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `AudioSampleEntry`
 *
 * @public
 */
export function readAudioSampleEntry<T extends IsoBoxType, V extends IsoInt64>(
	type: T,
	cursor: IsoBoxReadCursor<V>,
): AudioSampleEntry<T, V> {
	cursor.pos += 6

	const dataReferenceIndex = readUint16(cursor)
	const entryVersion = readUint16(cursor)

	cursor.pos += 6

	const channelCount = readUint16(cursor)
	const sampleSize = readUint16(cursor)
	const preDefined = readUint16(cursor)

	cursor.pos += 2

	return {
		type,
		dataReferenceIndex,
		entryVersion,
		channelCount,
		sampleSize,
		preDefined,
		sampleRate: readTemplate32(cursor),
		boxes: readChildBoxes(cursor),
	}
}
