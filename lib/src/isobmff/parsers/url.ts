import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type UrlBox = FullBox & {
	location: string;
};

// ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
export function url(view: IsoView): UrlBox {
	return {
		...view.readFullBox(),
		location: view.readString(-1),
	};
};
