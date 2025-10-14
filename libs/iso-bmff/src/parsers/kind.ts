import type { Fields } from '../boxes/Fields.ts';
import type { TrackKindBox } from '../boxes/TrackKindBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a TrackKinBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackKindBox
 *
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
