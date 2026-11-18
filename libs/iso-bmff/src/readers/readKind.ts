import type { KindBox } from '../boxes/KindBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `kind` box (`KindBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `KindBox`
 *
 * @public
 */
export function readKind(view: IsoBoxReadView<IsoInt64>): KindBox {
	return {
		type: 'kind',
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	}
}
