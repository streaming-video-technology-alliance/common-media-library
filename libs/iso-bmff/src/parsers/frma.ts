import type { Fields } from '../boxes/Fields.ts';
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse an OriginalFormatBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed OriginalFormatBox
 *
 *
 * @beta
 */
export function frma(view: IsoView): Fields<OriginalFormatBox> {
	return {
		dataFormat: view.readUint(4),
	};
};
