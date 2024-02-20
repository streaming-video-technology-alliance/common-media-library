import { Track } from './Track.js';

export class SwitchingSet {
	id: string;
	tracks : Track[];

	constructor(id:string, tracks:Track[]) {
		this.id = id;
		this.tracks = tracks;
	}
}
