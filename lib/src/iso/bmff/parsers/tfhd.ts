import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentHeaderBox = FullBox & {
	trackId: number;
	baseDataOffset?: number;
	sampleDescriptionOffset?: number;
	defaultSampleDuration?: number;
	defaultSampleSize?: number;
	defaultSampleFlags?: number;
};

/**
 * Parse a TrackFragmentHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function tfhd(view: IsoView): TrackFragmentHeaderBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		trackId: view.readUint(4),
		baseDataOffset: flags & 0x01 ? view.readUint(8) : undefined,
		sampleDescriptionOffset: flags & 0x02 ? view.readUint(4) : undefined,
		defaultSampleDuration: flags & 0x08 ? view.readUint(4) : undefined,
		defaultSampleSize: flags & 0x10 ? view.readUint(4) : undefined,
		defaultSampleFlags: flags & 0x20 ? view.readUint(4) : undefined,
	};
};
