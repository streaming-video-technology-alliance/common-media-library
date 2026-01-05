
import type { Base } from './Base.ts'
import type { Duration } from './Duration.ts'
import type { EventStream } from './EventStream.ts'
import type { Ham } from './Ham.ts'
import type { Manifest } from './Manifest.ts'
import type { SelectionSet } from './SelectionSet.ts'

/**
 * CMAF-HAM Presentation type
 *
 * @alpha
 */
export type Presentation = Ham & Duration & Base & {
	// TODO: Should parent fields be optional?
	parent: Manifest;

	selectionSets: SelectionSet[];
	startTime: number;
	endTime: number;
	eventStreams: EventStream[];
};
