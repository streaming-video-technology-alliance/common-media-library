import { Track } from './Track.js';
import { IVisitorElement } from '../visitor/HamElement.js';
import { ElementVisitor } from '../visitor/ElementVisitor.js';
import { trackFromJSON } from '../../utils/ham/track.js';
import { IHam } from '../interfaces/IHam.js';

export class SwitchingSet implements IHam, IVisitorElement {
	id: string;
	tracks: Track[];

	constructor(id: string, tracks: Track[]) {
		this.id = id;
		this.tracks = tracks;
	}

	public toString(): string {
		return JSON.stringify(this);
	}

	static fromJSON(json: any): SwitchingSet {
		return new SwitchingSet(
			json.id,
			json.tracks.map((track: any) => trackFromJSON(track, track.type)),
		);
	}

	accept(visitor: ElementVisitor): void {
		visitor.visitSwitchingSet(this);
	}

	public getTracks(predicate?: (track: Track) => boolean): Track[] {
		const tracks = this.tracks;
		return predicate ? tracks.filter(predicate) : tracks;
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
}
