import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleDescriptionBox = FullBox & {
	entryCount: number,
	entries: any[],
};

/**
 * Parse a SampleDescriptionBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SampleDescriptionBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function stsd(view: IsoView): SampleDescriptionBox {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);

	return {
		version,
		flags,
		entryCount,
		entries: view.readBoxes(entryCount),
	};
};
