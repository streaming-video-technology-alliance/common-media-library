import type { CursorView } from '../CursorView.js';

export type DataBox = {
	data: Uint8Array;
}

// ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
export function mdat(view: CursorView): DataBox {
	return {
		data: view.readData(-1),
	};
};
