import type { AudioSampleEntry, AudioSampleEntryChild } from '../boxes/AudioSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'

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
export function readAudioSampleEntry<T extends IsoBoxType>(
	type: T,
	cursor: IsoBoxReadCursor<IsoInt64>,
): AudioSampleEntry<T> {
	const view = new IsoBoxReadView(cursor)

	const { jump, readUint, readTemplate, readBoxes } = view

	return {
		type,
		dataReferenceIndex: (jump(6), readUint(2)),
		entryVersion: readUint(2),
		channelCount: (jump(6), readUint(2)),
		sampleSize: readUint(2),
		preDefined: readUint(2),
		sampleRate: (jump(2), readTemplate(4)),
		boxes: readBoxes<AudioSampleEntryChild>(),
	}
}
