import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type LabelBox = FullBox & {
	isGroupLabel: boolean;
	labelId: number;
	langauge: string;
	label: string;
}

// ISO/IEC 14496-12:202x - 8.10.5 Label box
export function labl(view: IsoView): LabelBox {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		isGroupLabel: (flags & 0x1) !== 0,
		labelId: view.readUint(2),
		langauge: view.readUtf8(-1),
		label: view.readUtf8(-1),
	};
}
