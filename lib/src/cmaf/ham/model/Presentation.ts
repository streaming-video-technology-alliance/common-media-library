import { SelectionSet } from './SelectionSet.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class Presentation implements IElement {
	id: string;
	selectionSets: SelectionSet[];

	constructor(id: string, selectionSet: SelectionSet[]) {
		this.id = id;
		this.selectionSets = selectionSet;
	}

	public toJSON() {
		return JSON.stringify(this);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitPresentation(this);
	}

}
