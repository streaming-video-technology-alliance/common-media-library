import type { IsoView } from '../IsoView.js';
import type { Fields } from '../boxes/Fields.js';
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.js';
import type { SampleEntryBox } from '../boxes/SampleEntryBox.js';

/**
 * Parse a SampleDescriptionBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDescriptionBox
 *
 *
 * @beta
 */
export function stsd<E extends SampleEntryBox = SampleEntryBox>(view: IsoView): Fields<SampleDescriptionBox<E>> {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);

	return {
		version,
		flags,
		entryCount,
		entries: view.readBoxes<E>(entryCount),
	};
};
