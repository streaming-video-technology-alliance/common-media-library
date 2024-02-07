import { Track } from './Track.js';

export class AudioTrack extends Track{
    sampleRate:number;
    channels:number;

    constructor(id:string, type:string,codec:string,duration:number,language:string,bandwidth:number, sampleRate:number, channels:number) {
        super(id, type,codec,duration,language,bandwidth);
        this.sampleRate = sampleRate;
        this.channels = channels;
    }
}