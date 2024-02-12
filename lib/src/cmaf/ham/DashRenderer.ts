import { ElementVisitor } from './visitor/ElementVisitor.js';
import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from './model';

export class DashRenderer implements ElementVisitor {
	public visitPresentation(element: Presentation): void {
		console.log({ element });
	}

	public visitSelectionSet(element: SelectionSet): void {
		console.log({ element });
	}

	public visitSwitchingSet(element: SwitchingSet): void {
		console.log({ element });
	}

	public visitTrack(element: Track): void {
		console.log({ element });
	}

	public visitAudioTrack(element: AudioTrack): void {
		console.log({ element });
	}

	public visitVideoTrack(element: VideoTrack): void {
		console.log({ element });
	}

	public visitTextTrack(element: TextTrack): void {
		console.log({ element });
	}

	public visitSegment(element: Segment): void {
		console.log({ element });
	}
}
