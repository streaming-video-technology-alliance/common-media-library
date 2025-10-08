import type { FullBox } from './FullBox.js';
import type { ShadowSyncEntry } from './ShadowSyncEntry.js';

/**
 * Shadow Sync Sample Box - 'stsh'
 *
 *
 * @beta
 */
export type ShadowSyncSampleBox = FullBox & {
	type: 'stsh';
	entryCount: number;
	entries: ShadowSyncEntry[];
};
