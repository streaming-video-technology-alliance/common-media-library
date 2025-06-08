import type { FullBox } from './FullBox.js';

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
	type: 'stss';
	entryCount: number;
	entries: SyncSample[];
};
