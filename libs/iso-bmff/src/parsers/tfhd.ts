import type { Fields } from '../boxes/Fields.js';
import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackFragmentHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentHeaderBox
 *
 *
 * @beta
 */
export function tfhd(view: IsoView): Fields<TrackFragmentHeaderBox> {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		trackId: view.readUint(4),
		baseDataOffset: flags & 0x01 ? view.readUint(8) : undefined,
		sampleDescriptionIndex: flags & 0x02 ? view.readUint(4) : undefined,
		defaultSampleDuration: flags & 0x08 ? view.readUint(4) : undefined,
		defaultSampleSize: flags & 0x10 ? view.readUint(4) : undefined,
		defaultSampleFlags: flags & 0x20 ? view.readUint(4) : undefined,
	};
};
