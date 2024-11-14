import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type SchemeTypeBox = FullBox & {
	schemeType: number;
	schemeVersion: number;
	schemeUri?: string;
};

// ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
export function schm(view: IsoView): SchemeTypeBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		schemeType: view.readUint(4),
		schemeVersion: view.readUint(4),
		schemeUri: flags & 0x000001 ? view.readString(-1) : undefined,
	};
};
