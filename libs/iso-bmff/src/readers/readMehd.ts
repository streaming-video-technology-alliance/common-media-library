import type { Fields } from '../boxes/types/Fields.ts'
import type { MovieExtendsHeaderBox } from '../boxes/types/MovieExtendsHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a MovieExtendsHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieExtendsHeaderBox
 *
 * @public
 */
export function readMehd(view: IsoBoxReadView): Fields<MovieExtendsHeaderBox> {
	const { version, flags } = view.readFullBox()

	return {
		version,
		flags,
		fragmentDuration: view.readUint((version === 1) ? 8 : 4),
	}
};
