import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type MovieFragmentHeaderBox = FullBox & {
	sequenceNumber: number;
};

// ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
export function mfhd(view: IsoView): MovieFragmentHeaderBox {
	return {
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	};
};
