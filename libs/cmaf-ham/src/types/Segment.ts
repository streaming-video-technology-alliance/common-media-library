import type { AddressableObject } from './AddressableObject.ts'
import type { Duration } from './Duration.ts'
import type { Ham } from './Ham.ts'
import type { Track } from './Track.ts'

/**
 * CMAF-HAM Segment type
 *
 * @alpha
 */
// TODO: start and end time vs start time and duration vs all three?
export type Segment = Ham & AddressableObject & Duration & {
	parent: Track;
	startTime: number;
	endTime: number;
};
