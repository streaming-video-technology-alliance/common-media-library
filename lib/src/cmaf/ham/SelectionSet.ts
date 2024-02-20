import { SwitchingSet } from './SwitchingSet.js';

export class SelectionSet {
	id: string;
	switchingsSet:SwitchingSet[];

	constructor(id: string, switchingsSet:SwitchingSet[]) {
		this.id = id;
		this.switchingsSet = switchingsSet;
	}
}
