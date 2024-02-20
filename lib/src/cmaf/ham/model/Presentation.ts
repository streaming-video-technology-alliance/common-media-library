import { SelectionSet } from './SelectionSet.js';
import { IVisitorElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { Track } from './Track.js';
import { IHam } from '../interfaces/IHam.js';

export class Presentation implements IHam, IVisitorElement {
	id: string;
	selectionSets: SelectionSet[];

	constructor(id: string, selectionSet: SelectionSet[]) {
		this.id = id;
		this.selectionSets = selectionSet;
	}

	public toString(): string {
		return JSON.stringify(this);
	}

	static fromJSON(json: any): Presentation {
		return new Presentation(
			json.id,
			+json.duration,
			json.selectionSets.map((selectionSet: any) => SelectionSet.fromJSON(selectionSet)),
		);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitPresentation(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.selectionSets.flatMap(selectionSet =>
			selectionSet.getTracks(),
		);
		return (predicate) ? tracks.filter(predicate) : tracks;
	}
}
