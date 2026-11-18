import type { LabelBox } from '../boxes/LabelBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `labl` box (`LabelBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `LabelBox`
 *
 * @public
 */
export function readLabl(view: IsoBoxReadView<IsoInt64>): LabelBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'labl',
		version,
		flags,
		labelId: view.readUint(2),
		language: view.readUtf8(-1),
		label: view.readUtf8(-1),
	}
}
