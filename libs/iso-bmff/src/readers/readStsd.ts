import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { SampleEntryBox } from '../boxes/SampleEntryBox.ts'

/**
 * Parse a SampleDescriptionBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDescriptionBox
 *
 * @public
 */
export function readStsd<E extends SampleEntryBox = SampleEntryBox>(view: IsoBoxReadView): Fields<SampleDescriptionBox<E>> {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		version,
		flags,
		entryCount,
		entries: view.readBoxes<E>(entryCount),
	}
};
