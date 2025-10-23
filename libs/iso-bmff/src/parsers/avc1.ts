import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 *
 * @beta
 */
export function avc1(view: IsoView): Fields<VisualSampleEntryBox<'avc1'>> {
	const { readArray, readUint, readInt, readTemplate, readData } = view

	return {
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
		config: readData(-1),
	}
};
