import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:202x - 8.10.5 Label box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type LabelBox = FullBox & {
	isGroupLabel: boolean;
	labelId: number;
	language: string;
	label: string;
};

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
export function labl(view: IsoView): LabelBox {
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
