import {Track} from "./Track.js";
import { Segment } from "./Segment.js";

export class VideoTrack extends Track{
    width:number;
    height:number;
    frameRate:number;


    constructor(id:string, type:string, codec:string, duration:number, language:string, bandwidth:number, width:number, height:number, frameRate:number, segments: Segment[]) {
        super(id, type, codec, duration, language, bandwidth, segments);
        this.width = width;
        this.height = height;
        this.frameRate = frameRate;
    }

    public override getResolution():any{
        super.getResolution();
        return {width:this.width, height:this.height};
    }
}