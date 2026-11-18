import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { SampleEntry } from '../boxes/SampleEntry.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stsd` box (`SampleDescriptionBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleDescriptionBox`
 *
 * @public
 */
export function readStsd<E extends SampleEntry = AudioSampleEntry | VisualSampleEntry>(
	view: IsoBoxReadView<IsoInt64>,
): SampleDescriptionBox<E> {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stsd',
		version,
		flags,
		entryCount,
		boxes: view.readBoxes<E>(entryCount),
	}
}
