
import type { Base } from './model/Base.ts'
import type { Duration } from './model/Duration.ts'
import type { EventStream } from './model/timed-metadata/EventStream.ts'
import type { Ham } from './model/Ham.ts'
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
