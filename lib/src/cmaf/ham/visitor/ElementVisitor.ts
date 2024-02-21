import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../model/index.js';

export interface ElementVisitor {
	visitPresentation(element: Presentation): void;

	visitSelectionSet(element: SelectionSet): void;

	visitSwitchingSet(element: SwitchingSet): void;

	visitTrack(element: Track): void;

	visitAudioTrack(element: AudioTrack): void;

	visitVideoTrack(element: VideoTrack): void;

	visitTextTrack(element: TextTrack): void;

	visitSegment(element: Segment): void;
}
