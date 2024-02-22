import { SelectionSet } from './SelectionSet.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { Track } from './Track.js';

export class Presentation implements IElement {
	id: string;
	selectionSets: SelectionSet[];

	constructor(id: string, selectionSet: SelectionSet[]) {
		this.id = id;
		this.selectionSets = selectionSet;
	}

	public toString(): string {
		return JSON.stringify(this);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitPresentation(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.selectionSets.flatMap((selectionSet) =>
			selectionSet.getTracks()
		);
		return predicate ? tracks.filter(predicate) : tracks;
	}
}
