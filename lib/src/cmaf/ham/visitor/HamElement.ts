import { ElementVisitor } from './ElementVisitor.js';

export interface IVisitorElement {
	accept(visitor: ElementVisitor): void;
}
