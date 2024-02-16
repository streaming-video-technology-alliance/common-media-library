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
const AUDIO_TYPE = 'audio';
const VIDEO_TYPE = 'video';

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
    console.log(parsedM3u8);
    // console.log(parsedM3u8)
    const playlists: PlayList[] = parsedM3u8.playlists;
    const mediaGroupsAudio = parsedM3u8.mediaGroups?.AUDIO;
    let audioSwitchingSets: SwitchingSet[] = [];
    let audioTracks : AudioTrack[] = [];
    let selectionSets: SelectionSet[] = [];
    

    // Add selection set of type audio
    for (let audio in mediaGroupsAudio) {
        for (let attributes in mediaGroupsAudio[audio]) {
            let language = mediaGroupsAudio[audio][attributes].language;
            audioTracks.push(new AudioTrack(audio, AUDIO_TYPE, '', 0, language, 0, 0, 0,[]));
            audioSwitchingSets.push(new SwitchingSet(audio, AUDIO_TYPE, '', 0, language, audioTracks));
        }
    }

    selectionSets.push(new SelectionSet(uuid(), audioSwitchingSets));

    //Add selection set of type video

    await Promise.all(playlists.map(async (playlist: any) => {
        console.log("playlist", playlist)
        let manifestUrl = url.split("/").slice(0, -1).join("/") + "/" + playlist.uri;
        let hlsManifest = await readHLS(manifestUrl);
        let parsedHlsManifest = parseM3u8(hlsManifest);
        let switchingSets: SwitchingSet[] = [];
        let tracks: Track[]= [];


        await Promise.all(parsedHlsManifest?.segments?.map(async (segment:any) => {
            let {LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
            let {duration,uri} = segment;
            let resolution = {width: playlist.attributes.RESOLUTION.width, height: playlist.attributes.RESOLUTION.height};
            let { length, offset } = segment.byterange;
            let segments = [new Segment(duration ,uri,`${length}@${offset}`)];
            tracks.push(new VideoTrack(uuid(), VIDEO_TYPE,CODECS, duration, '', BANDWIDTH,resolution.width,resolution.height,playlist.attributes['FRAME-RATE'],segments));
            switchingSets.push(new SwitchingSet(uuid(), VIDEO_TYPE, CODECS, duration, LANGUAGE,tracks));
        }));
        selectionSets.push(new SelectionSet(uuid(), switchingSets));
    }));

    return new Presentation(uuid(), selectionSets);
}
(async () => {
    const url = 'https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8';
    const ham = (await m3u8toHam(url)).selectionsSets[0];
    const json =JSON.stringify(ham);
    fs.writeFileSync('ham.json',json) ;
})();




