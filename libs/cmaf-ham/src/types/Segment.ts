import type { AddressableObject } from './AddressableObject.ts';
import type { Ham } from './Ham.ts';
import type { Track } from './Track.ts';

export type Segment = Ham & AddressableObject & {
	parent: Track;
	startTime: number;
	endTime: number;

	// TODO: Do we keep this as a convenience field or do we calculate it from the start and end time?
	duration: number;
};
