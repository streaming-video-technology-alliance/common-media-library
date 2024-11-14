import type { IsoView } from '../IsoView';

export type FreeSpaceBox = {
	data: Uint8Array;
};

// ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
export function free(view: IsoView): FreeSpaceBox {
	return {
		data: view.readData(-1),
	};
};
