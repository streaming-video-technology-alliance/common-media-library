import { SwitchingSet } from './SwitchingSet';
import { IElement } from '../visitor/HamElement';
import { ElementVisitor } from '../visitor/ElementVisitor';

export class SelectionSet implements IElement {
	id: string;
	duration: number;
	switchingSet: SwitchingSet[];

	constructor(id: string, duration: number, switchingSet: SwitchingSet[]) {
		this.id = id;
		this.duration = duration;
		this.switchingSet = switchingSet;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSelectionSet(this);
	}
}
