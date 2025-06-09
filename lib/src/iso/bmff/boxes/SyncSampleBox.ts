import type { FullBox } from './FullBox.js';
import type { SyncSample } from './SyncSample.js';

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
