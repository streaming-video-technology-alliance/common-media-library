import { SelectionSet } from './SelectionSet';
import { IElement } from '../visitor/HamElement';
import { ElementVisitor } from '../visitor/ElementVisitor';

export class Presentation implements IElement{
	id: string;
	duration: number;
	selectionSets: SelectionSet[];

	constructor(id: string, duration: number, selectionSet: SelectionSet[]) {
		this.id = id;
		this.duration = duration;
		this.selectionSets = selectionSet;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitPresentation(this);
	}

}
