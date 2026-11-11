import type { TrackKindBox } from '../boxes/TrackKindBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackKindBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackKindBox`
 *
 * @public
 */
export function readKind(view: IsoBoxReadView<IsoInt64>): TrackKindBox {
	return {
		type: 'kind',
		...view.readFullBox(),
		schemeUri: view.readUtf8(-1),
		value: view.readUtf8(-1),
	}
}
