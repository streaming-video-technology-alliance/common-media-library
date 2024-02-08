import { Presentation, SelectionSet, SwitchingSet } from '../model';

export interface ElementVisitor {
	visitPresentation(element: Presentation): void;
	visitSelectionSet(element: SelectionSet): void;
	visitSwitchingSet(element: SwitchingSet): void;
}
