import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type MovieFragmentRandomAccessBox = FullBox & {
	size: number;
}

// ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
export function mfro(view: IsoView): MovieFragmentRandomAccessBox {
	return {
		...view.readFullBox(),
		size: view.readUint(4),
	};
};

