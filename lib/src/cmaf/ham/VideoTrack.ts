import {Track} from "./Track";

export class VideoTrack extends Track{
    width:number;
    height:number;
    frameRate:number;


    constructor(id:string, type:string,codec:string,duration:number,language:string,bandwidth:number, width:number, height:number,frameRate:number) {
        super(id, type,codec,duration,language,bandwidth);
        this.width = width;
        this.height = height;
        this.frameRate = frameRate;
    }
}