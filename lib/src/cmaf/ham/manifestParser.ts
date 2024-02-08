import { Presentation } from "./Presentation.js";
import { VideoTrack } from "./VideoTrack.js";
import { m3u8, PlayList, MediaGroups } from "./hlsManifest.js";
const AUDIO_TYPE = "audio";
const VIDEO_TYPE = "video";
async function readHLS(manifestUrl: string): Promise<string> {
    const response = await fetch(manifestUrl, {
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
        }
    });
    return response.text();
}


export async function hamToM3u8(presentation: Presentation): Promise<m3u8> {
    let playlists: PlayList[] = [];
    let mediaGroups: MediaGroups= { AUDIO: {} };
    let segments: any[] = [];
    for (const selectionSet of presentation.selectionsSets) {
        for (const switchingSet of selectionSet.switchingsSet) {
            const {language, codec, type} = switchingSet;
            if (type == AUDIO_TYPE){
                let mediaGroup : MediaGroups = {
                    AUDIO: {
                        [switchingSet.id]: {
                            [language]: {
                                language: language
                            }
                        }
                    }
                };
                mediaGroups = { ...mediaGroups, ...mediaGroup };
            }else if(type == VIDEO_TYPE){
                
                let playlist: PlayList = {
                    //TO DO : Check if we are saving uri
                    uri: '',
                    attributes: {
                        CODECS: codec,
                        BANDWIDTH: switchingSet.tracks[0].bandwidth,
                        RESOLUTION: {width:0, height: 0},
                        FRAME_RATE: 0
                    }
                };
                playlists.push(playlist);
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
        segments: segments
    };
}