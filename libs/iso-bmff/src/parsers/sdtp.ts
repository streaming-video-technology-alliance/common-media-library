import type { Fields } from '../boxes/Fields.js';
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

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
