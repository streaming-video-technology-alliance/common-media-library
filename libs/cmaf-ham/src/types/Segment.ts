import type { AddressableObject } from './model/AddressableObject.ts'
import type { Duration } from './model/Duration.ts'
import type { Ham } from './model/Ham.ts'
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
