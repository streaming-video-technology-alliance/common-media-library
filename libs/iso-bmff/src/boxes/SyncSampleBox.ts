import type { FullBox } from './FullBox.ts';
import type { SyncSample } from './SyncSample.ts';

/**
 * ISO/IEC 14496-12:2015 - 8.6.2 Sync Sample Box
 *
 *
 * @beta
 */
export type SyncSampleBox = FullBox & {
	type: 'stss';
	entryCount: number;
	entries: SyncSample[];
};
