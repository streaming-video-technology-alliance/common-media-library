import { Segment } from './Segment.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { IVisitorElement } from '../visitor/HamElement.js';

export abstract class Track implements IVisitorElement {
	id: string;
	type: string;
	codec: string;
	duration: number;
	language: string;
	bandwidth: number;
	segments: Segment[];

	constructor(
		id: string,
		type: string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
	) {
		this.id = id;
		this.type = type;
		this.codec = codec;
		this.duration = duration;
		this.language = language;
		this.bandwidth = bandwidth;
		this.segments = segments;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitTrack(this);
	}
}
