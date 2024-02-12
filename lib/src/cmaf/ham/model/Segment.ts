import { ElementVisitor } from '../visitor/ElementVisitor';

export class Segment {
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
