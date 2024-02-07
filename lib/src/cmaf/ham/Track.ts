export abstract class Track{
    id: string;
    type: string;
    codec:string;
    duration:number;
    language:string;
    bandwidth:number;

    constructor(id:string, type:string,codec:string,duration:number,language:string,bandwidth:number) {
        this.id = id;
        this.type = type;
        this.codec = codec;
        this.duration = duration;
        this.language = language;
        this.bandwidth = bandwidth;
    }

    public getResolution():any{
        return {};
    }
}
