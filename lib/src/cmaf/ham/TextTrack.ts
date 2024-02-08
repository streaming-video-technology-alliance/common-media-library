import { Track } from './Track';
import { Segment } from './Segment';

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

}
