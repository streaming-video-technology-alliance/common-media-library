import { ElementVisitor } from './ElementVisitor.js';

export interface IElement {
	accept(visitor: ElementVisitor): void;
}
