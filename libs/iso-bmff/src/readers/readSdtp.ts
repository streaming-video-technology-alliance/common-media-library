import type { Fields } from '../boxes/types/Fields.ts'
import type { SampleDependencyTypeBox } from '../boxes/types/SampleDependencyTypeBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SampleDependencyTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDependencyTypeBox
 *
 * @public
 */
export function readSdtp(view: IsoBoxReadView): Fields<SampleDependencyTypeBox> {
	return {
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	}
};
