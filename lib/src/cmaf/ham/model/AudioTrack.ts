import { Track } from './Track.js';
import { Segment } from './Segment.js';
import { ElementVisitor } from '../visitor/ElementVisitor';

export class AudioTrack extends Track {
	sampleRate: number;
	channels: number;

	constructor(
		id: string,
		type: string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
		sampleRate: number,
		channels: number
	) {
		super(id, type, codec, duration, language, bandwidth, segments);
		this.sampleRate = sampleRate;
		this.channels = channels;
	}

	override accept(visitor: ElementVisitor): void {
		visitor.visitAudioTrack(this);
	}

	static fromJSON(json: any): AudioTrack {
		return new AudioTrack(
			json.id,
			json.type,
			json.codec,
			+json.duration,
			json.language,
			+json.bandwidth,
			json.segments.map((segment: any) => Segment.fromJSON(segment)),
			+json.sampleRate,
			+json.channels
		);
	}
}
