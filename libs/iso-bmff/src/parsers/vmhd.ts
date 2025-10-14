import type { Fields } from '../boxes/Fields.ts';
import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts';
import { UINT } from '../fields/UINT.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a VideoMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VideoMediaHeaderBox
 *
 *
 * @beta
 */
export function vmhd(view: IsoView): Fields<VideoMediaHeaderBox> {
	return {
		...view.readFullBox(),
		graphicsmode: view.readUint(2),
		opcolor: view.readArray(UINT, 2, 3),
	};
};
