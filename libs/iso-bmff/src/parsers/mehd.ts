import type { Fields } from '../boxes/Fields.ts';
import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts';
import type { IsoView } from '../IsoView.ts';

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
