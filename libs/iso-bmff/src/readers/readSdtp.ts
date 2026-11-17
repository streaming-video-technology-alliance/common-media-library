import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `SampleDependencyTypeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleDependencyTypeBox`
 *
 * @public
 */
export function readSdtp(view: IsoBoxReadView<IsoInt64>): SampleDependencyTypeBox {
	return {
		type: 'sdtp',
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	}
}
