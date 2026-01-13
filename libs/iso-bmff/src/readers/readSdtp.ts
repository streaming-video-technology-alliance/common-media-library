import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SampleDependencyTypeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleDependencyTypeBox`
 *
 * @public
 */
export function readSdtp(view: IsoBoxReadView): SampleDependencyTypeBox {
	return {
		type: 'sdtp',
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	}
};
