import { SwitchingSet } from './SwitchingSet.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { Track } from './Track.js';

export class SelectionSet implements IElement {
	id: string;
	switchingSet: SwitchingSet[];

	constructor(id: string, switchingSet: SwitchingSet[]) {
		this.id = id;
		this.switchingSet = switchingSet;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSelectionSet(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.switchingSet.flatMap((switchingSet) =>
			switchingSet.getTracks()
		);
		return predicate ? tracks.filter(predicate) : tracks;
	}
}
