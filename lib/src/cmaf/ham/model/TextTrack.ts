import { Track } from './Track.js';
import { Segment } from './Segment.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class TextTrack extends Track {

	constructor(
		id: string,
		type: string,
		name: string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
	) {
		super(id, type, name, codec, duration, language, bandwidth, segments);
		this.id = id;
		this.type = type;
		this.name = name;
		this.codec = codec;
		this.duration = duration;
		this.language = language;
		this.bandwidth = bandwidth;
		this.segments = segments;
	}

	override accept(visitor: ElementVisitor): void {
		visitor.visitTextTrack(this);
	}

}
