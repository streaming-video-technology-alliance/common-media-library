import { SelectionSet } from './SelectionSet.js';

export class Presentation {
	id: string;
	selectionsSets: SelectionSet[];

	constructor(id: string,selectionsSet:SelectionSet[]) {
		this.id = id;
		this.selectionsSets = selectionsSet;
	}

	toJson(): string {
		return JSON.stringify(this);
	}

}
