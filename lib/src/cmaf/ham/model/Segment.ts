import { ElementVisitor } from '../visitor/ElementVisitor';
import { IElement } from '../visitor/HamElement';

export class Segment implements IElement {
	duration: number;
	url: string;
	byteRange: string | null;

	constructor(duration: number, url: string, byteRange: string | null) {
		this.duration = duration;
		this.url = url;
		this.byteRange = byteRange;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSegment(this);
	}
}
