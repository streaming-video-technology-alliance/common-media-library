import { Track } from "./Track";

export class SwitchingSet {
    id: string;
    type: string;
    codec:string;
    language:string;
    tracks : Track[];

    constructor(id:string, type:string, codec:string,  language:string, tracks:Track[]) {
        this.id = id;
        this.type = type;
        this.codec = codec;
        this.language = language;
        this.tracks = tracks;
    }
}