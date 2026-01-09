import type { VisualSampleEntryBox, VisualSampleEntryBoxChild } from '../boxes/VisualSampleEntryBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param type - The type of VisualSampleEntryBox to read
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 * @public
 */
export function readVisualSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView): VisualSampleEntryBox<T> {
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
		horizresolution: readTemplate(4),
		vertresolution: readTemplate(4),
		reserved3: readUint(4),
		frameCount: readUint(2),
		compressorName: readArray(UINT, 1, 32),
		depth: readUint(2),
		preDefined3: readInt(2),
		boxes: readBoxes<VisualSampleEntryBoxChild>(),
	}
};
