
import type { Base } from './Base.ts'
import type { Duration } from './Duration.ts'
import type { EventStream } from './timed-metadata/EventStream.ts'
import type { Ham } from './Ham.ts'
import type { SelectionSet } from './SelectionSet.ts'

/**
 * CMAF-HAM Presentation type
 *
 * @alpha
 */
export type Presentation = Ham & Duration & Base & {
	selectionSets: SelectionSet[];
	startTime: number;
	endTime: number;
	eventStreams?: EventStream[];
};
