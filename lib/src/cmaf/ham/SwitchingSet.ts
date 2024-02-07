import { Track } from "./Track";


export class SwitchingSet {
    id: string;
    type: string ;
    codec:string;
    duration:number;
    language:string;
    tracks : Track[];

    constructor(id:string, type:string ,codec:string,duration:number,language:string, tracks:Track[]) {
        this.id = id;
        this.type = type;
        this.codec = codec;
        this.duration = duration;
        this.language = language;
        this.tracks = tracks;
    }
    
}