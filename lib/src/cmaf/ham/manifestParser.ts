import { Presentation } from './model/index.js';
import { m3u8, PlayList, MediaGroups, Segment } from './hlsManifest.js';
import { parseMpd } from '../utils/dash/mpd.js';
import { mapMpdToHam } from './hamMapper.js';
import type { DashManifest } from '../utils/dash/DashManifest.js';

const AUDIO_TYPE = 'audio';
const VIDEO_TYPE = 'video';


function hamToM3u8(presentation: Presentation): m3u8 {
	const playlists: PlayList[] = [];
	let mediaGroups: MediaGroups = { AUDIO: {} };
	const segments: Segment[] = [];
	for (const selectionSet of presentation.selectionSets) {
		for (const switchingSet of selectionSet.switchingSet) {
			const { language, codec, type } = switchingSet;
			if (type == AUDIO_TYPE) {
				const mediaGroup: MediaGroups = {
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
			else if (type == VIDEO_TYPE) {
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
				duration: switchingSet.tracks[0].duration,
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

async function mpdToHam(manifest: string): Promise<Presentation | null> {
	let dashManifest: DashManifest | undefined;
	await parseMpd(manifest, (result: DashManifest) => dashManifest = result);

	if (!dashManifest) {
		return null;
	}

	return mapMpdToHam(dashManifest);
}

export { hamToM3u8, mpdToHam };
