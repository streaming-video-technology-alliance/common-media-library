import type { Fields } from '../boxes/Fields.ts'
import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SchemeTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SchemeTypeBox
 *
 * @public
 */
export function readSchm(view: IsoBoxReadView): Fields<SchemeTypeBox> {
	const { version, flags } = view.readFullBox()

	return {
		version,
		flags,
		schemeType: view.readUint(4),
		schemeVersion: view.readUint(4),
		schemeUri: flags & 0x000001 ? view.readString(-1) : undefined,
	}
};
