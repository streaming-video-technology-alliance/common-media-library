import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { IElement } from '../visitor/HamElement.js';

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

	static fromJSON(json: any) {
		return new Segment(
			json.duration,
			json.url,
			json.byteRange,
		);
	}
}
