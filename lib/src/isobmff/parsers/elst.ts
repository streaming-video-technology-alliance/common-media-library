import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type EditListEntry = {
	segmentDuration: number;
	mediaTime: number;
	mediaRateInteger: number;
	mediaRateFraction: number;
}

export type EditListBox = FullBox & {
	entryCount: number;
	entries: EditListEntry[];
}

// ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
export function elst(view: IsoView): EditListBox {
	const { version, flags } = view.readFullBox();
	const v1 = version === 1;
	const size = v1 ? 8 : 4;

	const entryCount = view.readUint(4);
	const entries = view.readEntries<EditListEntry>(entryCount, () => ({
		segmentDuration: view.readUint(size),
		mediaTime: view.readInt(size),
		mediaRateInteger: view.readInt(2),
		mediaRateFraction: view.readInt(2),
	}));

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
