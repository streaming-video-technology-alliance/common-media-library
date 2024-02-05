import { SelectionSet } from './SelectionSet';
export class Presentation {

	id: string;
	duration: number;
	selectionsSets: SelectionSet[];

	constructor(id: string, duration: number, selectionsSet:SelectionSet[]) {
		this.id = id;
		this.duration = duration;
		this.selectionsSets = selectionsSet;
	}

}
