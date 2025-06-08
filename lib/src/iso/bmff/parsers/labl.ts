import type { Fields } from '../boxes/Fields.js';
import type { LabelBox } from '../boxes/LabelBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a LabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed LabelBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function labl(view: IsoView): Fields<LabelBox> {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		isGroupLabel: (flags & 0x1) !== 0,
		labelId: view.readUint(2),
		language: view.readUtf8(-1),
		label: view.readUtf8(-1),
	};
}
