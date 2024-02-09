import { ElementVisitor } from './visitor/ElementVisitor.js';
import { Presentation, SelectionSet, SwitchingSet } from './model';

export class DashRenderer implements ElementVisitor {
	public visitPresentation(element: Presentation): void {
		console.log({ element });
	}

	public visitSelectionSet(element: SelectionSet): void {
		console.log({ element });
	}

	public visitSwitchingSet(element: SwitchingSet): void {
		console.log({ element });
	}
}
