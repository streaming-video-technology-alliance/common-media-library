import { UINT } from '../fields/UINT.js';
import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleDependencyTypeBox = FullBox & {
	sampleDependencyTable: number[];
};

//

/**
 * Parse a SampleDependencyTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDependencyTypeBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function sdtp(view: IsoView): SampleDependencyTypeBox {
	return {
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	};
};
