import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SubtitleMediaHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SubtitleMediaHeaderBox`
 *
 * @public
 */
export function readSthd(view: IsoBoxReadView): SubtitleMediaHeaderBox {
	return {
		type: 'sthd',
		...view.readFullBox(),
	}
};
