import { Presentation } from './model/index.js';
import { m3u8, PlayList, MediaGroups, Segment } from './HlsManifest.js';
import { jsonToXml, xmlToJson } from '../utils/xml.js';
import { mapMpdToHam } from './hamMapper.js';
import { mapHamToMpd } from '../utils/dash/mpdMapper.js';
import type { DashManifest } from '../utils/dash/DashManifest.js';

const AUDIO_TYPE = 'audio';
const VIDEO_TYPE = 'video';

function hamToM3u8(presentation: Presentation): m3u8 {
	const playlists: PlayList[] = [];
	let mediaGroups: MediaGroups = { AUDIO: {} };
	const segments: Segment[] = [];
	for (const selectionSet of presentation.selectionSets) {
		for (const switchingSet of selectionSet.switchingSets) {
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
	await xmlToJson(manifest, (result: DashManifest) => dashManifest = result);

	if (!dashManifest) {
		return null;
	}

	return mapMpdToHam(dashManifest);
}

async function hamToMpd(ham: Presentation): Promise<string | null> {
	const jsonMpd = mapHamToMpd(ham);

	if (!jsonMpd) {
		return null;
	}

	return await jsonToXml(jsonMpd);
}

export { hamToM3u8, mpdToHam, hamToMpd };
