import { Track } from './Track.js';
import { Segment } from './Segment.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';

export class TextTrack extends Track {

	constructor(
		id: string,
		type: string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
	) {
		super(id, type, codec, duration, language, bandwidth, segments);
		this.id = id;
		this.type = type;
		this.codec = codec;
		this.duration = duration;
		this.language = language;
		this.bandwidth = bandwidth;
		this.segments = segments;
	}

	override accept(visitor: ElementVisitor): void {
		visitor.visitTextTrack(this);
	}

	static fromJSON(json: any): TextTrack {
		return new TextTrack(
			json.id,
			json.type,
			json.codec,
			+json.duration,
			json.language,
			+json.bandwidth,
			json.segments.map((segment: any) => Segment.fromJSON(segment)),
		);
	}
}
