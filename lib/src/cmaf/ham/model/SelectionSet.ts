import { SwitchingSet } from './SwitchingSet.js';
import { IVisitorElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { Track } from './Track.js';
import { IHam } from '../interfaces/IHam.js';

export class SelectionSet implements IHam, IVisitorElement {
	id: string;
	duration: number;
	switchingSets: SwitchingSet[];

	constructor(id: string, duration: number, switchingSet: SwitchingSet[]) {
		this.id = id;
		this.duration = duration;
		this.switchingSets = switchingSet;
	}

	public toString(): string {
		return JSON.stringify(this);
	}

	static fromJSON(json: any): SelectionSet {
		return new SelectionSet(
			json.id,
			+json.duration,
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
