import type { Fields } from '../boxes/types/Fields.ts'
import type { OriginalFormatBox } from '../boxes/types/OriginalFormatBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse an OriginalFormatBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed OriginalFormatBox
 *
 * @public
 */
export function readFrma(view: IsoBoxReadView): Fields<OriginalFormatBox> {
	return {
		dataFormat: view.readUint(4),
	}
};
