import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SubtitleMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubtitleMediaHeaderBox
 *
 * @public
 */
export function readSthd(view: IsoBoxReadView): SubtitleMediaHeaderBox {
	return {
		type: 'sthd',
		...view.readFullBox(),
	}
};
