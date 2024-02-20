import { Track } from './Track.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class SwitchingSet implements IElement {
	id: string;
	type: string;
	codec: string;
	language: string;
	tracks: Track[];

	constructor(id: string, type: string, codec: string, language: string, tracks: Track[]) {
		this.id = id;
		this.type = type;
		this.codec = codec;
		this.language = language;
		this.tracks = tracks;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSwitchingSet(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.tracks;
		return (predicate) ? tracks.filter(predicate) : tracks;
	}
}
