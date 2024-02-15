import { Track } from './Track.js';
import { IElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { trackFromJSON } from '../../utils/ham/track.js';

export class SwitchingSet implements IElement {
	id: string;
	type: string;
	codec: string;
	duration: number;
	language: string;
	tracks: Track[];

	constructor(id: string, type: string, codec: string, duration: number, language: string, tracks: Track[]) {
		this.id = id;
		this.type = type;
		this.codec = codec;
		this.duration = duration;
		this.language = language;
		this.tracks = tracks;
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSwitchingSet(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.tracks;
		return (predicate) ? tracks.filter(predicate) : tracks;
	}

	public validateTracks(): boolean {
		let duration: number | undefined;
		let isValid = true;
		this.getTracks().forEach(track => {
			if (!duration) {
				duration = track.duration;
			}
			if (track.duration !== duration) {
				isValid = false;
			}
		});
		return isValid;
	}

	static fromJSON(json: any): SwitchingSet {
		return new SwitchingSet(
			json.id,
			json.type,
			json.codec,
			+json.duration,
			json.language,
			json.tracks.map((track: any) => trackFromJSON(track, json.type)),
		);
	}
}
