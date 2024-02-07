import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';
import { Track } from './Track.js';
import { PlayList, MediaGroups, m3u8 } from './hlsManifest.js';
import { AudioTrack } from './AudioTrack.js';
import { VideoTrack } from './VideoTrack.js';


async function readHLS(manifestUrl: string): Promise<string> {
    const response = await fetch(manifestUrl, {
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
        }
    });
    return response.text();
}

export async function hamToM3u8(presentation: Presentation): Promise<m3u8> {
    const playlists: PlayList[] = [];
    const mediaGroups: MediaGroups= { AUDIO: {} };
    const segments: any[] = [];

    for (const selectionSet of presentation.selectionsSets) {
        for (const switchingSet of selectionSet.switchingsSet) {
            const language = switchingSet.language;
            const codecs = switchingSet.codec;
            
            
            const playlist: PlayList = {
                uri: generateUri(switchingSet.id),
                attributes: {
                    AUDIO: switchingSet.type === 'audio' ? switchingSet.id : '', 
                    LANGUAGE: language,
                    CODECS: codecs,
                    BANDWIDTH: switchingSet.tracks[0].bandwidth,
                    RESOLUTION: switchingSet.tracks[0].getResolution(),
                }
            };
            playlists.push(playlist);

            if (switchingSet.type === 'audio') {
                if (!mediaGroups.AUDIO[switchingSet.id]) {
                    mediaGroups.AUDIO[switchingSet.id] = {};
                }
                mediaGroups.AUDIO[switchingSet.id][language] = { language: language };
            }

            const segment: any = {
                duration: switchingSet.duration
            };
            segments.push(segment);
        }
    }

    return {
        playlists: playlists,
        mediaGroups: mediaGroups,
        segments: []
    };
}

function generateUri(id: string): string {
    return `playlist_${id}.m3u8`;
}


export async function m3u8toHam(url: string): Promise<Presentation> {
    const hls: string = await readHLS(url);
    const parsedM3u8 = parseM3u8(hls);
    const playlists: PlayList[] = parsedM3u8.playlists;
    const mediaGroups = parsedM3u8.mediaGroups;
    let audioSwitchingSets: SwitchingSet[] = [];
    let audioTracks : AudioTrack[] = [];
    let selectionSets: SelectionSet[] = [];
    const mediaGroupsAudio = mediaGroups?.AUDIO;

    for (let audio in mediaGroupsAudio) {
        for (let attributes in mediaGroupsAudio[audio]) {
            audioSwitchingSets.push(new SwitchingSet(audio, "audio", "aac", 0, mediaGroupsAudio[audio][attributes].language,[]));
            audioTracks.push(new AudioTrack(audio, "audio", "aac", 0, mediaGroupsAudio[audio][attributes].language, 0, 0, 0));
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
            selectionSetDuration += segment.duration;
            let type = "video";
            let language = playlist.attributes.LANGUAGE;
            tracks.push(new VideoTrack(uuid(), type,playlist.attributes.CODECS, segment.duration, playlist.attributes.FRAME_RATE, playlist.attributes.BANDWIDTH,playlist.attributes.RESOLUTION.width,playlist.attributes.RESOLUTION.height,0));
            switchingSets.push(new SwitchingSet(uuid(), type, playlist.attributes.CODECS, segment.duration, language,tracks));
        }));
        selectionSets.push(new SelectionSet(uuid(), selectionSetDuration, switchingSets));
    }));

    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });

    return new Presentation(uuid(), selectionSets[0].duration, selectionSets);
}

const url = "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8";
const presentation = await m3u8toHam(url);
console.log(presentation);
