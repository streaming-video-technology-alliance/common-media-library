import type { VisualSampleEntry, VisualSampleEntryChild } from '../boxes/VisualSampleEntry.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

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
export function readVisualSampleEntry<T extends IsoBoxType>(
	type: T,
	cursor: IsoBoxReadCursor<IsoInt64>,
): VisualSampleEntry<T> {
	const view = new IsoBoxReadView(cursor)

	const { jump, readArray, readUint, readInt, readTemplate, readBoxes } = view

	return {
		type,
		dataReferenceIndex: (jump(6), readUint(2)),
		preDefined1: readUint(2),
		preDefined2: (jump(2), readArray(UINT, 4, 3)),
		width: readUint(2),
		height: readUint(2),
		horizResolution: readTemplate(4),
		vertResolution: readTemplate(4),
		frameCount: (jump(4), readUint(2)),
		compressorName: readArray(UINT, 1, 32),
		depth: readUint(2),
		preDefined3: readInt(2),
		boxes: readBoxes<VisualSampleEntryChild>(),
	}
}
