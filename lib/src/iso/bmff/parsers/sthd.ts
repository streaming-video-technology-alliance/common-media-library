import type { Fields } from '../boxes/Fields.js';
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a SubtitleMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubtitleMediaHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function sthd(view: IsoView): Fields<SubtitleMediaHeaderBox> {
	return view.readFullBox();
};
