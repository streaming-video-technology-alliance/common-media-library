import { Track } from './Track';
import { Segment } from './Segment';

export class VideoTrack extends Track {
	width: number;
	height: number;
	frameRate: number;
	par: string;
	sar: string;
	scanType: string;

	constructor(
		id: string,
		type: string,
		codec: string,
		duration: number,
		language: string,
		bandwidth: number,
		segments: Segment[],
		width: number,
		height: number,
		frameRate: number,
		par: string,
		sar: string,
		scanType: string,
	) {
		super(id, type, codec, duration, language, bandwidth, segments);
		this.width = width;
		this.height = height;
		this.frameRate = frameRate;
		this.par = par;
		this.sar = sar;
		this.scanType = scanType;
	}
}
