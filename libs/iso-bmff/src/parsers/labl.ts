import type { Fields } from '../boxes/Fields.ts'
import type { LabelBox } from '../boxes/LabelBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a LabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed LabelBox
 *
 *
 * @beta
 */
export function labl(view: IsoView): Fields<LabelBox> {
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
