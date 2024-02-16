import { Track } from "./Track";

export class SwitchingSet {
    id: string;
    codec:string;
    language:string;
    tracks : Track[];

    constructor(id:string,  codec:string,  language:string, tracks:Track[]) {
        this.id = id;
        this.codec = codec;
        this.language = language;
        this.tracks = tracks;
    }
}