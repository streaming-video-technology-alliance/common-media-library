import type { FullBox } from './FullBox.ts'
import type { ShadowSyncEntry } from './ShadowSyncEntry.ts'

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
