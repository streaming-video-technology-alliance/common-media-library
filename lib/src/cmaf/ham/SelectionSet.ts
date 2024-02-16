import { SwitchingSet } from './SwitchingSet';
export class SelectionSet {
	id: string;
	switchingsSet:SwitchingSet[];

	constructor(id: string, switchingsSet:SwitchingSet[]) {
		this.id = id;
		this.switchingsSet = switchingsSet;
	}
}
