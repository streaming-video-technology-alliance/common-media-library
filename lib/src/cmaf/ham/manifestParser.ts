// @ts-ignore
import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';

async function readHLS(manifestUrl: string) {
    const response = await fetch(manifestUrl, {
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
        }
    });
    return response.text();
}

export async function m3u8toHam(url:string) {
    const hls = await readHLS(url);
    const parsedM3u8 = parseM3u8(hls);
    const segments = parsedM3u8.playlists;
    let presentationSetDuration = 0;
    let selectionSets:SelectionSet[] = [];
    await segments.forEach(async (playlist:any) => {
        let segmentUrl = url.split("/");
        let segmentUrlWithoutLast = segmentUrl.slice(0, segmentUrl.length - 1).join("/").concat("/").concat(playlist.uri);
        let parse = await readHLS(segmentUrlWithoutLast);
        let parsedSegment = parseM3u8(parse);
        let selectionSetDuration = 0;
        let switchingSets :SwitchingSet[]= [];
        await parsedSegment.segments.forEach(async(segment:any) => { 
            selectionSetDuration += segment.duration;
            presentationSetDuration += segment.duration;
            let type = segment.map ? "video" : "audio";
            let language = playlist.attributes.LANGUAGE;
            switchingSets.push(new SwitchingSet(uuid(), type, playlist.attributes.CODECS, segment.duration, language));
        });
        selectionSets.push(new SelectionSet(uuid(), selectionSetDuration, switchingSets));
        selectionSetDuration = 0;
        switchingSets = [];
    });

    await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        } , 1000);}
    );

   
    return new Presentation(uuid(), presentationSetDuration, selectionSets);
}

