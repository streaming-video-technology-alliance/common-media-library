import type { AddressableObject } from './AddressableObject.ts'
import type { Duration } from './Duration.ts'
import type { Ham } from './Ham.ts'

/**
 * CMAF-HAM Segment type
 *
 * @alpha
 */
export type Segment = Ham & AddressableObject & Duration & {
	startTime: number;
};
