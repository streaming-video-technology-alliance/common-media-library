import { Track } from './Track.js';
import { Segment } from './Segment.js';

export class VideoTrack extends Track{
	width:number;
	height:number;
	frameRate:number;


	constructor(id:string, codec:string, duration:number, language:string, bandwidth:number, width:number, height:number, frameRate:number, segments: Segment[]) {
		super(id, codec, duration, language, bandwidth, segments);
		this.width = width;
		this.height = height;
		this.frameRate = frameRate;
	}

}
