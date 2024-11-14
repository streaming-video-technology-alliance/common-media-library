import type { IsoView } from '../IsoView.js';

export type IdentifiedMediaDataBox = {
	imdaIdentifier: number;
	data: Uint8Array;
};

// ISO/IEC 14496-12:2012 - 9.1.4.1 Identified media data box
export function imda(view: IsoView): IdentifiedMediaDataBox {
	return {
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	};
};
