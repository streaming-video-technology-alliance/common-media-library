import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SchemeTypeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SchemeTypeBox`
 *
 * @public
 */
export function readSchm(view: IsoBoxReadView): SchemeTypeBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'schm',
		version,
		flags,
		schemeType: view.readUint(4),
		schemeVersion: view.readUint(4),
		schemeUri: flags & 0x000001 ? view.readString(-1) : undefined,
	}
};
