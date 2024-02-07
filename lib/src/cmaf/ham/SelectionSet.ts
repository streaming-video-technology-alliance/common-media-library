import { SwitchingSet } from './SwitchingSet';
export class SelectionSet {
	id: string;
	duration: number;
	switchingsSet:SwitchingSet[];

	constructor(id: string, duration: number, switchingsSet:SwitchingSet[]) {
		this.id = id;
		this.duration = duration;
		this.switchingsSet = switchingsSet;
	}
}