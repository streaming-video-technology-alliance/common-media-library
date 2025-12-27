import type { Fields } from '../boxes/types/Fields.ts'
import type { VideoMediaHeaderBox } from '../boxes/types/VideoMediaHeaderBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a VideoMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VideoMediaHeaderBox
 *
 * @public
 */
export function readVmhd(view: IsoBoxReadView): Fields<VideoMediaHeaderBox> {
	return {
		...view.readFullBox(),
		graphicsmode: view.readUint(2),
		opcolor: view.readArray(UINT, 2, 3),
	}
};
