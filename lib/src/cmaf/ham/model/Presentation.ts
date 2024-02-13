import { SelectionSet } from './SelectionSet.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class Presentation implements IElement {
	id: string;
	duration: number;
	selectionSets: SelectionSet[];

	constructor(id: string, duration: number, selectionSet: SelectionSet[]) {
		this.id = id;
		this.duration = duration;
		this.selectionSets = selectionSet;
	}

	public toJSON() {
		return JSON.stringify(this);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitPresentation(this);
	}

}
