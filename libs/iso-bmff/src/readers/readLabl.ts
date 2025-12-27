import type { Fields } from '../boxes/types/Fields.ts'
import type { LabelBox } from '../boxes/types/LabelBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a LabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed LabelBox
 *
 * @public
 */
export function readLabl(view: IsoBoxReadView): Fields<LabelBox> {
	const { version, flags } = view.readFullBox()

	return {
		version,
		flags,
		isGroupLabel: (flags & 0x1) !== 0,
		labelId: view.readUint(2),
		language: view.readUtf8(-1),
		label: view.readUtf8(-1),
	}
}
