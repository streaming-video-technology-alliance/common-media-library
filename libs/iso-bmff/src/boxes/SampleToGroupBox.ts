import type { FullBox } from './FullBox.ts'
import type { SampleToGroupEntry } from './SampleToGroupEntry.ts'

/**
 * Sample to Group Box - 'sbgp'
 *
 *
 * @beta
 */
export type SampleToGroupBox = FullBox<'sbgp'> & {
	groupingType: number;
	groupingTypeParameter?: number;
	entryCount: number;
	entries: SampleToGroupEntry[];
};
