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
    const playlists: PlayList[] = parsedM3u8.playlists;
    const mediaGroupsAudio = parsedM3u8.mediaGroups?.AUDIO;
    let audioSwitchingSets: SwitchingSet[] = [];
    let audioTracks : AudioTrack[] = [];
    let selectionSets: SelectionSet[] = [];
    
    for (let audio in mediaGroupsAudio) {
        for (let attributes in mediaGroupsAudio[audio]) {
            let language = mediaGroupsAudio[audio][attributes].language;
            audioSwitchingSets.push(new SwitchingSet(audio, AUDIO_TYPE, '', 0, language,[]));
            audioTracks.push(new AudioTrack(audio, AUDIO_TYPE, '', 0, language, 0, 0, 0,[]));
        }
    }

    await Promise.all(playlists.map(async (playlist: any) => {
        let manifestUrl = url.split("/").slice(0, -1).join("/") + "/" + playlist.uri;
        let hlsManifest = await readHLS(manifestUrl);
        let parsedHlsManifest = parseM3u8(hlsManifest);
        let selectionSetDuration: number = 0;
        let switchingSets: SwitchingSet[] = [];
        let tracks: Track[]= [];
        let audioId = playlist.attributes.AUDIO;

        if (audioId) {
            let audioSearched = audioSwitchingSets.find((audio) => audio.id === audioId);
            let audioInSwitchingSet = switchingSets.find((audio) => audio.id === audioId);
            if (audioSearched && !audioInSwitchingSet) switchingSets.push(audioSearched);
        }

        await Promise.all(parsedHlsManifest?.segments?.map(async (segment:any) => {
            let {LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
            let {duration,uri} = segment;
            let resolution = {width: playlist.attributes.RESOLUTION.width, height: playlist.attributes.RESOLUTION.height};
            let { length, offset } = segment.byterange;
            selectionSetDuration += duration;
            let segments = [new Segment(duration ,uri,`${length}@${offset}`)];
            tracks.push(new VideoTrack(uuid(), VIDEO_TYPE,CODECS, duration, '', BANDWIDTH,resolution.width,resolution.height,playlist.attributes['FRAME-RATE'],segments));
            switchingSets.push(new SwitchingSet(uuid(), VIDEO_TYPE, CODECS, duration, LANGUAGE,tracks));
        }));
        selectionSets.push(new SelectionSet(uuid(), selectionSetDuration, switchingSets));
    }));

    return new Presentation(uuid(), selectionSets);
}


