import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type TrackExtendsBox = FullBox & {
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};

// ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
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
