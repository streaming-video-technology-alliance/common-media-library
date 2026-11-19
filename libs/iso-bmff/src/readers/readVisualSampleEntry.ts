import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt16 } from '../cursor/readInt16.ts'
import { readTemplate32 } from '../cursor/readTemplate32.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import { readCompressorName } from '../cursor/readCompressorName.ts'

/**
 * Read a visual sample entry box (`VisualSampleEntry`) of the given type.
 *
 * @param type - The type of `VisualSampleEntry` to read
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readVisualSampleEntry<T extends IsoBoxType, V extends IsoInt64>(
	type: T,
	cursor: IsoBoxReadCursor<V>,
): VisualSampleEntry<T, V> {
	cursor.pos += 6

	const dataReferenceIndex = readUint16(cursor)
	const preDefined1 = readUint16(cursor)

	cursor.pos += 2

	const preDefined2 = [readUint32(cursor), readUint32(cursor), readUint32(cursor)]
	const width = readUint16(cursor)
	const height = readUint16(cursor)
	const horizResolution = readTemplate32(cursor)
	const vertResolution = readTemplate32(cursor)

	cursor.pos += 4

	return {
		type,
		dataReferenceIndex,
		preDefined1,
		preDefined2,
		width,
		height,
		horizResolution,
		vertResolution,
		frameCount: readUint16(cursor),
		compressorName: readCompressorName(cursor),
		depth: readUint16(cursor),
		preDefined3: readInt16(cursor),
		boxes: readChildBoxes(cursor),
	}
}
