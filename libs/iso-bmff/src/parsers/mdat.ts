import type { Fields } from '../boxes/Fields.ts'
import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a MediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MediaDataBox
 *
 *
 * @beta
 */
export function mdat(view: IsoView): Fields<MediaDataBox> {
	return {
		data: view.readData(-1),
	}
};
