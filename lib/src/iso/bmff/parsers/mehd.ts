import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieExtendsHeaderBox = FullBox & {
	fragmentDuration: number;
};

/**
 * Parse a MovieExtendsHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieExtendsHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mehd(view: IsoView): MovieExtendsHeaderBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		fragmentDuration: view.readUint((version === 1) ? 8 : 4),
	};
};
