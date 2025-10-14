import type { IsoView } from '../IsoView.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts';
import type { SampleEntryBox } from '../boxes/SampleEntryBox.ts';

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
