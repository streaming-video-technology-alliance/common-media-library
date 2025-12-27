import type { Fields } from '../boxes/types/Fields.ts'
import type { TrackKindBox } from '../boxes/types/TrackKindBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a TrackKinBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackKindBox
 *
 * @public
 */
export function readKind(view: IsoBoxReadView): Fields<TrackKindBox> {
	return {
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	}
};
