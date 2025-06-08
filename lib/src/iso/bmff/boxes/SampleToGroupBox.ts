import type { FullBox } from './FullBox.js';
import type { SampleToGroupEntry } from './SampleToGroupEntry.js';

/**
 * Sample to Group Box - 'sbgp'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleToGroupBox = FullBox & {
	type: 'sbgp';
	groupingType: number;
	groupingTypeParameter?: number;
	entryCount: number;
	entries: SampleToGroupEntry[];
};
