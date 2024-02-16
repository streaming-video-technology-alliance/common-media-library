import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';
import { Track } from './Track.js';
import { PlayList } from './hlsManifest.js';
import { AudioTrack } from './AudioTrack.js';
import { Segment } from './Segment.js';
import { VideoTrack } from './VideoTrack.js';
import fs from 'fs';


async function readHLS(manifestUrl: string): Promise<string> {
    const response = await fetch(manifestUrl, {
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
        }
    });
    return response.text();
}

export async function m3u8toHam(url: string): Promise<Presentation> {
    const hls: string = await readHLS(url);
    const parsedM3u8 = parseM3u8(hls);
    const playlists: PlayList[] = parsedM3u8.playlists;
    const mediaGroupsAudio = parsedM3u8.mediaGroups?.AUDIO;
    let audioSwitchingSets: SwitchingSet[] = [];
    let audioTracks : AudioTrack[] = [];
    let selectionSets: SelectionSet[] = [];
    

    // Add selection set of type audio
    for (let audio in mediaGroupsAudio) {
        for (let attributes in mediaGroupsAudio[audio]) {
            let language = mediaGroupsAudio[audio][attributes].language;
            let uri = mediaGroupsAudio[audio][attributes].uri;       
            let manifestUrl = formatSegmentUrl(url, uri);
            let audioManifest = await readHLS(manifestUrl);
            let audioParsed = parseM3u8(audioManifest);
            let segments : Segment[] = await formatSegments(audioParsed?.segments);
            let targetDuration = audioParsed?.targetDuration;
            audioTracks.push(new AudioTrack(audio, '', targetDuration, language, 0, 0, 0, segments));
            audioSwitchingSets.push(new SwitchingSet(audio, audioTracks));
        }
    }

    selectionSets.push(new SelectionSet(uuid(), audioSwitchingSets));

    //Add selection set of type video
    let switchingSetVideos: SwitchingSet[] = [];

    await Promise.all(playlists.map(async (playlist: any) => {
        let manifestUrl = formatSegmentUrl(url, playlist.uri);
        let hlsManifest = await readHLS(manifestUrl);
        let parsedHlsManifest = parseM3u8(hlsManifest);
        let tracks: Track[]= [];
        let segments : Segment[] = await formatSegments(parsedHlsManifest?.segments)
        let {LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
        let targetDuration = parsedHlsManifest?.targetDuration;
        let resolution = {width: playlist.attributes.RESOLUTION.width, height: playlist.attributes.RESOLUTION.height};
        tracks.push(new VideoTrack(uuid(),CODECS, targetDuration, LANGUAGE, BANDWIDTH,resolution.width,resolution.height,playlist.attributes['FRAME-RATE'],segments));
        switchingSetVideos.push(new SwitchingSet(uuid(),tracks));

    }));
    selectionSets.push(new SelectionSet(uuid(), switchingSetVideos));


    return new Presentation(uuid(), selectionSets);
}

async function formatSegments(segments:any[]){
    await Promise.all(segments.map(async (segment:any) => {
        let {duration,uri} = segment;
        let { length, offset } = segment.byterange;
        segments.push(new Segment(duration ,uri,`${length}@${offset}`));
    }));
    return segments;
}

function formatSegmentUrl (url:string, segmentUrl:string){
    return url.split("/").slice(0, -1).join("/") + "/" + segmentUrl;
}
(async () => {
    const url = 'https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8';
    const ham = (await m3u8toHam(url)).selectionsSets[1];
    const json =JSON.stringify(ham);
    fs.writeFileSync('ham.json',json) ;
})();




