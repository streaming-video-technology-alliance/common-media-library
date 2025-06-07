import type { FullBox } from './FullBox.js';

/**
 * Sync Sample Box - 'stss'
 */
export type SyncSampleBox = FullBox & {
	type: 'stss';
	entryCount: number;
	sampleNumber: number[];
};
