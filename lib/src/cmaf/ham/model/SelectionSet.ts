import { SwitchingSet } from './SwitchingSet.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

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
}
