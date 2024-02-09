import { Track } from './Track.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class SwitchingSet implements IElement {
	id: string;
	type: string;
	codec: string;
	duration: number;
	language: string;
	tracks: Track[];

	constructor(id: string, type: string, codec: string, duration: number, language: string, tracks: Track[]) {
		this.id = id;
		this.type = type;
		this.codec = codec;
		this.duration = duration;
		this.language = language;
		this.tracks = tracks;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSwitchingSet(this);
	}
}
