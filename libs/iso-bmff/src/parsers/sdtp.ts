import type { Fields } from '../boxes/Fields.ts';
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts';
import { UINT } from '../fields/UINT.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a SampleDependencyTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDependencyTypeBox
 *
 *
 * @beta
 */
export function sdtp(view: IsoView): Fields<SampleDependencyTypeBox> {
	return {
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	};
};
