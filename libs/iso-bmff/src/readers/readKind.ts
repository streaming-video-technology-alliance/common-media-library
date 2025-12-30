import type { TrackKindBox } from '../boxes/TrackKindBox.ts'
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
export function readKind(view: IsoBoxReadView): TrackKindBox {
	return {
		type: 'kind',
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	}
};
