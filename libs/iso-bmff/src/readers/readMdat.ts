import type { Fields } from '../boxes/Fields.ts'
import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a MediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MediaDataBox
 *
 * @public
 */
export function readMdat(view: IsoBoxReadView): Fields<MediaDataBox> {
	return {
		data: view.readData(-1),
	}
};
