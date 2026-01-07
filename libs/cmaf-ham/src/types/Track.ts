import type { AddressableObject } from './model/AddressableObject.ts'
import type { Base } from './model/Base.ts'
import type { Duration } from './model/Duration.ts'
import type { Ham } from './model/Ham.ts'
import type { Segment } from './model/Segment.ts'
// import type { SwitchingSet } from './SwitchingSet.ts'
import type { TrackType } from './model/TrackType.ts'

/**
 * CMAF-HAM Track type
 *
 * @alpha
 */
// TODO: Tracks should have generics to allow for media specific fields, i.e VideoTrack, AudioTrack, TextTrack, ImageTrack, etc.
// TODO: Duration is just for convenience. The duration should match the presentation duration.
export type Track = Ham & Base & Duration & {
	// parent: SwitchingSet;
	type: TrackType;
	bandwidth: number;
	segments: Segment[];
	index: number;
	initialization: AddressableObject;
	segmentIndex: AddressableObject & { timescale: number };
	mimeType: string;
	codecs: string;
	presentationTimeOffset: number;
}
