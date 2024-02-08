import { SwitchingSet } from './SwitchingSet';

export class SelectionSet {
	id: string;
	duration: number;
	switchingSet: SwitchingSet[];

	constructor(id: string, duration: number, switchingSet: SwitchingSet[]) {
		this.id = id;
		this.duration = duration;
		this.switchingSet = switchingSet;
	}
}
