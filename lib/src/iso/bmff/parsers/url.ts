import type { Fields } from '../boxes/Fields.js';
import type { UrlBox } from '../boxes/UrlBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a UrlBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrlBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function url(view: IsoView): Fields<UrlBox> {
	return {
		...view.readFullBox(),
		location: view.readString(-1),
	};
};
