import type { AudioSampleEntryBox, AudioSampleEntryBoxChild } from '../boxes/AudioSampleEntryBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Parse a `AudioSampleEntryBox` from an `IsoBoxReadView`.
 *
 * @param type - The type of `AudioSampleEntryBox` to read
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioSampleEntryBox`
 *
 * @public
 */
export function readAudioSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView): AudioSampleEntryBox<T> {
	const { readArray, readUint, readTemplate, readBoxes } = view

	return {
		type,
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		channelcount: readUint(2),
		samplesize: readUint(2),
		preDefined: readUint(2),
		reserved3: readUint(2),
		samplerate: readTemplate(4),
		boxes: readBoxes<AudioSampleEntryBoxChild>()
	}
};
