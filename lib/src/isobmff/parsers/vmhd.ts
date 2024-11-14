import { UINT } from '../fields/UINT';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type VideoMediaHeaderBox = FullBox & {
	graphicsmode: number,
	opcolor: number[],
};

// ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
export function vmhd(view: IsoView): VideoMediaHeaderBox {
	return {
		...view.readFullBox(),
		graphicsmode: view.readUint(2),
		opcolor: view.readArray(UINT, 2, 3),
	};
};
