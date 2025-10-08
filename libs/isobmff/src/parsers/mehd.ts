import type { Fields } from '../boxes/Fields.js';
import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a MovieExtendsHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieExtendsHeaderBox
 *
 *
 * @beta
 */
export function mehd(view: IsoView): Fields<MovieExtendsHeaderBox> {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		fragmentDuration: view.readUint((version === 1) ? 8 : 4),
	};
};
