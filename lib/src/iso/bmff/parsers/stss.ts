import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Sync sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SyncSample = {
	sampleNumber: number;
};

/**
 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SyncSampleBox = FullBox & {
	entryCount: number;
	entries: SyncSample[];
};

/**
 * Parse a SyncSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SyncSampleBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function stss(view: IsoView): SyncSampleBox {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);

	return {
		version,
		flags,
		entryCount,
		entries: view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		})),
	};
};
