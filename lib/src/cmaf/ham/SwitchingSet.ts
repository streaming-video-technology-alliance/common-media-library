export class SwitchingSet {
    
    id: string;
    type: string;
    codec:string;
    duration:number;
    language:string;

    constructor(id:string, type:string,codec:string,duration:number,language:string) {
        this.id = id;
        this.type = type;
        this.codec = codec;
        this.duration = duration;
        this.language = language;
    }
}