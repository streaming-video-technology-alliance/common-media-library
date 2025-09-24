import type { Fields } from '../boxes/Fields.js';
import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a VideoMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VideoMediaHeaderBox
 *
 * @group ISOBMFF
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
