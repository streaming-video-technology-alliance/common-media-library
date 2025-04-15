import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackExtendsBox = FullBox & {
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};

/**
 * Parse a TrackExtendsBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackExtendsBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function trex(view: IsoView): TrackExtendsBox {
	return {
		...view.readFullBox(),
		trackId: view.readUint(4),
		defaultSampleDescriptionIndex: view.readUint(4),
		defaultSampleDuration: view.readUint(4),
		defaultSampleSize: view.readUint(4),
		defaultSampleFlags: view.readUint(4),
	};
};
