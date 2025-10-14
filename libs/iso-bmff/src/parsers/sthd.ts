import type { Fields } from '../boxes/Fields.ts';
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a SubtitleMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubtitleMediaHeaderBox
 *
 *
 * @beta
 */
export function sthd(view: IsoView): Fields<SubtitleMediaHeaderBox> {
	return view.readFullBox();
};
