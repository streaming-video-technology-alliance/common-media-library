import type { AddressableObject } from './AddressableObject.ts'
import type { Duration } from './Duration.ts'
import type { Ham } from './Ham.ts'
import type { Track } from './Track.ts'

/**
 * CMAF-HAM Segment type
 *
 * @alpha
 */
export type Segment = Ham & AddressableObject & Duration & {
	parent: Track;
	startTime: number;
};
