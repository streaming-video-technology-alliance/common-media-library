import type { Fields } from '../boxes/Fields.js';
import type { MediaDataBox } from '../boxes/MediaDataBox.js';
import type { IsoView } from '../IsoView.js';

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
	};
};
