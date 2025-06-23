import type { Fields } from '../boxes/Fields.js';
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse an OriginalFormatBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed OriginalFormatBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function frma(view: IsoView): Fields<OriginalFormatBox> {
	return {
		dataFormat: view.readUint(4),
	};
};
