import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type TrackKindBox = FullBox & {
	schemeUri: string;
	value: string;
}

// ISO/IEC 14496-12:202x - 8.10.4 Track kind box
export function kind(view: IsoView): TrackKindBox {
	return {
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	};
};
