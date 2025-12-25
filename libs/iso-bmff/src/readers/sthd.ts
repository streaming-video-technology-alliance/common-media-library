import type { Fields } from '../boxes/Fields.ts'
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

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
export function sthd(view: IsoBoxReadView): Fields<SubtitleMediaHeaderBox> {
	return view.readFullBox()
};
