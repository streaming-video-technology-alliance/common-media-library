import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type CompositionTimeToSampleEntry = {
	sampleCount: number;
	sampleOffset: number;
}

export type CompositionTimeToSampleBox = FullBox & {
	entryCount: number;
	entries: CompositionTimeToSampleEntry[];
};

// ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
export function ctts(view: IsoView): CompositionTimeToSampleBox {
	const { version, flags } = view.readFullBox();
	const read = version === 1 ? view.readInt : view.readUint;

	const entryCount = view.readUint(4);
	const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
		sampleCount: view.readUint(4),
		sampleOffset: read(4),
	}));

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
