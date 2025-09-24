import type { Fields } from '../boxes/Fields.js';
import type { TrackKindBox } from '../boxes/TrackKindBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackKinBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackKindBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function kind(view: IsoView): Fields<TrackKindBox> {
	return {
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	};
};
