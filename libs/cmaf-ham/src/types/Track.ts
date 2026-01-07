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
	// NOTE: Missing in new definition
	// fileName?: string;
	// NOTE: Need to confirm differences with "codec" vs "codecs" + mimeType
	codecs: string;
	mimeType: string;
	// NOTE: Missing in new definition (should possibly be moved to AudioTrack/TextTrack specific types)
	// language: string;
	bandwidth: number;
	// NOTE: Confirm that byteRange + urlInitialization from old definition are equivalent to initialization AddressableObject
	initialization: AddressableObject;
	segments: Segment[];
	// NOTE: Discuss these (not just MPEG-DASH specific, but a subset of DASH representations).
	index: number;
	segmentIndex: AddressableObject & { timescale: number };
	// NOTE: DASH-specific concept
	presentationTimeOffset: number;
}
