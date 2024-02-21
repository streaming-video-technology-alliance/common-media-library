import { Track } from './Track.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class SwitchingSet implements IElement {
	id: string;
	tracks: Track[];

	constructor(id: string, tracks: Track[]) {
		this.id = id;
		this.tracks = tracks;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSwitchingSet(this);
	}
}
