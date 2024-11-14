import { UINT } from '../fields/UINT';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type SampleDependencyTypeBox = FullBox & {
	sampleDependencyTable: number[];
};

// ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
export function sdtp(view: IsoView): SampleDependencyTypeBox {
	return {
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	};
};
