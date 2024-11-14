import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type TrackFragmentDecodeTimeBox = FullBox & {
	baseMediaDecodeTime: number;
};

// ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
export function tfdt(view: IsoView): TrackFragmentDecodeTimeBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		baseMediaDecodeTime: view.readUint((version == 1) ? 8 : 4),
	};
};
