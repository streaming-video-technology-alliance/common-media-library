import type { AddressableObject } from './AddressableObject.ts'
import type { Base } from './Base.ts'
import type { Ham } from './Ham.ts'
import type { Segment } from './Segment.ts'
import type { SwitchingSet } from './SwitchingSet.ts'
import type { TrackType } from './TrackType.ts'

// TODO: Tracks should have generics to all for media specific fields, i.e VideoTrack, AudioTrack, TextTrack, ImageTrack, etc.
export type Track = Ham & Base & {
	parent: SwitchingSet;
	type: TrackType;
	duration: number;
	bandwidth: number;
	segments: Segment[];
	index: number;
	initialization: AddressableObject;
	segmentIndex: AddressableObject & { timescale: number };
	mimeType: string;
	codecs: string;
	presentationTimeOffset: number;
}
