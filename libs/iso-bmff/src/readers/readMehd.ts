import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieExtendsHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieExtendsHeaderBox`
 *
 * @public
 */
export function readMehd(view: IsoBoxReadView): MovieExtendsHeaderBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'mehd',
		version,
		flags,
		fragmentDuration: view.readUint((version === 1) ? 8 : 4),
	}
};
