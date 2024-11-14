import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type UrnBox = FullBox & {
	name: string;
	location: string;
};

// ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
export function urn(view: IsoView): UrnBox {
	return {
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	};
};
