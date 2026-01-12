import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { SampleEntryBox } from '../boxes/SampleEntryBox.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SampleDescriptionBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleDescriptionBox`
 *
 * @public
 */
export function readStsd<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox>(view: IsoBoxReadView): SampleDescriptionBox<E> {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stsd',
		version,
		flags,
		entryCount,
		entries: view.readBoxes<E>(entryCount),
	}
};
