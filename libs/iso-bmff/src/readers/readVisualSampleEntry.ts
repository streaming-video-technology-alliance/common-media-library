import type { VisualSampleEntry, VisualSampleEntryChild } from '../boxes/VisualSampleEntry.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Read a visual sample entry box (`VisualSampleEntry`) of the given type.
 *
 * @param type - The type of `VisualSampleEntry` to read
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readVisualSampleEntry<T extends IsoBoxType>(
	type: T,
	view: IsoBoxReadView<IsoInt64>,
): VisualSampleEntry<T> {
	const { readArray, readUint, readInt, readTemplate, readBoxes } = view

	return {
		type,
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		preDefined1: readUint(2),
		reserved2: readUint(2),
		preDefined2: readArray(UINT, 4, 3),
		width: readUint(2),
		height: readUint(2),
		horizResolution: readTemplate(4),
		vertResolution: readTemplate(4),
		reserved3: readUint(4),
		frameCount: readUint(2),
		compressorName: readArray(UINT, 1, 32),
		depth: readUint(2),
		preDefined3: readInt(2),
		boxes: readBoxes<VisualSampleEntryChild>(),
	}
}
