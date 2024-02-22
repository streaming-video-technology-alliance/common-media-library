import { SwitchingSet } from './SwitchingSet.js';
import { IVisitorElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { Track } from './Track.js';
import { IHam } from '../interfaces/IHam.js';

export class SelectionSet implements IHam, IVisitorElement {
	id: string;
	switchingSets: SwitchingSet[];

	constructor(id: string, switchingSets: SwitchingSet[]) {
		this.id = id;
		this.switchingSets = switchingSets;
	}

	public toString(): string {
		return JSON.stringify(this);
	}

	static fromJSON(json: any): SelectionSet {
		return new SelectionSet(
			json.id,
			json.switchingSets.map((switchingSet: any) => SwitchingSet.fromJSON(switchingSet)),
		);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSelectionSet(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.switchingSets.flatMap(switchingSet =>
			switchingSet.getTracks(),
		);
		return (predicate) ? tracks.filter(predicate) : tracks;
	}
}
