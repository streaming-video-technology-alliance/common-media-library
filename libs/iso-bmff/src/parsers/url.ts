import type { Fields } from '../boxes/Fields.ts';
import type { UrlBox } from '../boxes/UrlBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a UrlBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrlBox
 *
 *
 * @beta
 */
export function url(view: IsoView): Fields<UrlBox> {
	return {
		...view.readFullBox(),
		location: view.readString(-1),
	};
};
