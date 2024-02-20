import { Track } from './Track.js';
import { Segment } from './Segment.js';
export class AudioTrack extends Track{
	sampleRate:number;
	channels:number;

	constructor(id:string, codec:string,duration:number,language:string,bandwidth:number, sampleRate:number, channels:number, segments:Segment[]) {
		super(id,codec,duration,language,bandwidth,segments);
		this.sampleRate = sampleRate;
		this.channels = channels;
	}
}
