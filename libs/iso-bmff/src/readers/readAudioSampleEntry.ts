import type { AudioSampleEntry, AudioSampleEntryChild } from '../boxes/AudioSampleEntry.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

/**
 * Read an audio sample entry box (`AudioSampleEntry`) of the given type.
 *
 * @param type - The type of `AudioSampleEntry` to read
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioSampleEntry`
 *
 * @public
 */
export function readAudioSampleEntry<T extends IsoBoxType>(
	type: T,
	view: IsoBoxReadView<IsoInt64>,
): AudioSampleEntry<T> {
	const { readArray, readUint, readTemplate, readBoxes } = view

	return {
		type,
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		channelCount: readUint(2),
		sampleSize: readUint(2),
		preDefined: readUint(2),
		reserved3: readUint(2),
		sampleRate: readTemplate(4),
		boxes: readBoxes<AudioSampleEntryChild>(),
	}
}
