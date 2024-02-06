import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';
import { Track } from './Track.js';
import { PlayList } from './hlsManifest.js';
import { AudioTrack } from './AudioTrack.js';
import { Segment } from 'hls-parser/types.js';
import { VideoTrack } from './VideoTrack.js';


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
        let segmentUrl = url.split("/");
        let segmentUrlWithoutLast = segmentUrl.slice(0, segmentUrl.length - 1).join("/").concat("/").concat(playlist.uri);
        let parse = await readHLS(segmentUrlWithoutLast);
        let parsedSegment = parseM3u8(parse);
        let selectionSetDuration: number = 0;
        let switchingSets: SwitchingSet[] = [];
        let tracks: Track[]= [];
        let audioId = playlist.attributes.AUDIO;

        if (audioId) {
            let audioSearched = audioSwitchingSets.find((audio) => audio.id === audioId);
            let audioInSwitchingSet = switchingSets.find((audio) => audio.id === audioId);
            if (audioSearched && !audioInSwitchingSet) switchingSets.push(audioSearched);
        }

        await Promise.all(parsedSegment?.segments?.map(async (segment:Segment) => {
            selectionSetDuration += segment.duration;
            let type = "video";
            let language = playlist.attributes.LANGUAGE;
            tracks.push(new VideoTrack(uuid(), type,playlist.attributes.CODECS, segment.duration, "", playlist.attributes.BANDWIDTH,playlist.attributes.RESOLUTION.width,playlist.attributes.RESOLUTION.height,0));
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

