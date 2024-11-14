import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type MovieExtendsHeaderBox = FullBox & {
	fragmentDuration: number;
};

// ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
export function mehd(view: IsoView): MovieExtendsHeaderBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		fragmentDuration: view.readUint((version === 1) ? 8 : 4),
	};
};
