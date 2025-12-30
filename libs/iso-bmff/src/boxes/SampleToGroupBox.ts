import type { FullBox } from './FullBox.ts'
import type { SampleToGroupEntry } from './SampleToGroupEntry.ts'

/**
 * Sample to Group Box - 'sbgp'
 *
 * @public
 */
export type SampleToGroupBox = FullBox & {
	type: 'sbgp';
	groupingType: number;
	groupingTypeParameter?: number;
	entryCount: number;
	entries: SampleToGroupEntry[];
};
