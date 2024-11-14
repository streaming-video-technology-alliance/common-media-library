import { UINT } from '../fields/UINT';
import type { IsoView } from '../IsoView';

export type HandlerReferenceBox = {
	preDefined: number;
	handlerType: string;
	reserved: number[];
	name: string;
};

// ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
export function hdlr(view: IsoView): HandlerReferenceBox {
	return {
		...view.readFullBox(),
		preDefined: view.readUint(4),
		handlerType: view.readString(4),
		reserved: view.readArray(UINT, 4, 3),
		name: view.readString(-1),
	};
};
