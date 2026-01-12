import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse an `OriginalFormatBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `OriginalFormatBox`
 *
 * @public
 */
export function readFrma(view: IsoBoxReadView): OriginalFormatBox {
	return {
		type: 'frma',
		dataFormat: view.readUint(4),
	}
};
