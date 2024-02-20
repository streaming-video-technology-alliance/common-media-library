import { Presentation } from './Presentation.js';
import { m3u8, PlayList, MediaGroups ,Segment } from './hlsManifest.js';
const AUDIO_TYPE = 'audio';
const VIDEO_TYPE = 'video';


export async function hamToM3u8(presentation: Presentation): Promise<m3u8> {
	const playlists: PlayList[] = [];
	let mediaGroups: MediaGroups = { AUDIO: {} };
	const segments: Segment[] = [];
	for (const selectionSet of presentation.selectionSets) {
		for (const switchingSet of selectionSet.switchingSet) {
			const { language, codec, type } = switchingSet;
			if (type == AUDIO_TYPE){
				const mediaGroup : MediaGroups = {
					AUDIO: {
						[switchingSet.id]: {
							[language]: {
								language: language,
							},
						},
					},
				};
				mediaGroups = { ...mediaGroups, ...mediaGroup };
			}
			else if (type == VIDEO_TYPE){
				for (const track of switchingSet.tracks) {
					if (track.isVideoTrack(track)) {
						playlists.push({
							uri: '',
							attributes: {
								CODECS: codec,
								BANDWIDTH: track.bandwidth,
								FRAME_RATE: track.frameRate,
								RESOLUTION: { width: track.width, height: track.height },
							},
    
						});
					}
				}
			}
			const segment: Segment = {
				duration: switchingSet.duration,
			};
			segments.push(segment);
		}
	}
	return {
		playlists: playlists,
		mediaGroups: mediaGroups,
		segments: segments,
	};
}
