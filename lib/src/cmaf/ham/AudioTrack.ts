import { Track } from './Track.js';
import { Segment } from './Segment.js';

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
		channels: number,
	) {
		super(id, type, codec, duration, language, bandwidth, segments);
		this.sampleRate = sampleRate;
		this.channels = channels;
	}
}
