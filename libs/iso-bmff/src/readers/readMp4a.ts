import type { AudioSampleEntryBox } from '../boxes/types/AudioSampleEntryBox.ts'
import type { Fields } from '../boxes/types/Fields.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse an AudioSampleEntry from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioSampleEntry
 *
 * @public
 */
export function readMp4a(view: IsoBoxReadView): Fields<AudioSampleEntryBox<'mp4a'>> {
	const { readArray, readUint, readTemplate, readData } = view

	return {
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		channelcount: readUint(2),
		samplesize: readUint(2),
		preDefined: readUint(2),
		reserved3: readUint(2),
		samplerate: readTemplate(4),
		esds: readData(-1),
	}
};
