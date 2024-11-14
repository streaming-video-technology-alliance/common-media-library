import type { IsoView } from '../IsoView.js';

export type FormatBox = {
	dataFormat: number;
}

// ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
export function frma(view: IsoView): FormatBox {
	return {
		dataFormat: view.readUint(4),
	};
};
