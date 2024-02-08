import { ElementVisitor } from './ElementVisitor';

export interface IElement {
	accept(visitor: ElementVisitor): void;
}
