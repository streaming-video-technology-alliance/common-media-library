import { SelectionSet } from './SelectionSet.js';
export class Presentation {
	id: string;
	duration: number;
	selectionSets: SelectionSet[];

	constructor(id: string, duration: number, selectionSet: SelectionSet[]) {
		this.id = id;
		this.duration = duration;
		this.selectionSets = selectionSet;
	}

}
