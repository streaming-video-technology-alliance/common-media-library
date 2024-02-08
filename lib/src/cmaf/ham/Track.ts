import {Segment}  from './Segment.js';
export abstract class Track{
    id: string;
    type: string;
    codec:string;
    duration:number;
    language:string;
    bandwidth:number;
    segments: Segment[];

    constructor(id:string, type:string,codec:string,duration:number,language:string,bandwidth:number,segments: Segment[]) {
        this.id = id;
        this.type = type;
        this.codec = codec;
        this.duration = duration;
        this.language = language;
        this.bandwidth = bandwidth;
        this.segments = segments;
    }

    public getResolution():any{
        return {};
    }
}
