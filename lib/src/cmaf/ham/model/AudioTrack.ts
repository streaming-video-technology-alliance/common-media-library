import { Track } from './Track.js';
import { Segment } from './Segment.js';
import { ElementVisitor } from '../visitor/ElementVisitor';

export class AudioTrack extends Track {
	sampleRate: number;
	channels: number;

	constructor(
		id: string,
		type: string,
		name : string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
		sampleRate: number,
		channels: number,
	) {
		super(id, type, name, codec, duration, language, bandwidth, segments);
		this.sampleRate = sampleRate;
		this.channels = channels;
	}

	override accept(visitor: ElementVisitor): void {
		visitor.visitAudioTrack(this);
	}
}
