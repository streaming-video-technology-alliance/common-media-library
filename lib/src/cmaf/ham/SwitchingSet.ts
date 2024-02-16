import { Track } from "./Track";

export class SwitchingSet {
    id: string;
    tracks : Track[];

    constructor(id:string, tracks:Track[]) {
        this.id = id;
        this.tracks = tracks;
    }
}