import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from './types/model/index.js';
import { parseM3u8 } from '../utils/hls/m3u8.js';
import { uuid } from '../../utils.js';
import { m3u8, MediaGroups, PlayList, SegmentHls } from '../utils/hls/HlsManifest.js';
import { jsonToXml, xmlToJson } from '../utils/xml.js';
import { mapMpdToHam } from './hamMapper.js';
import { mapHamToMpd } from '../utils/dash/mpdMapper.js';
import type { DashManifest } from '../utils/dash/DashManifest.js';
import { formatSegments, formatSegmentUrl, readHLS } from '../utils/hls/hlsMapper.js';

async function m3u8toHam(hlsManifest: string, url: string): Promise<Presentation> {
	const parsedM3u8 = parseM3u8(hlsManifest);
	const playlists: PlayList[] = parsedM3u8.playlists;
	const mediaGroupsAudio = parsedM3u8.mediaGroups?.AUDIO;
	const mediaGroupsSubtitles = parsedM3u8.mediaGroups?.SUBTITLES;
	const audioSwitchingSets: SwitchingSet[] = [];
	const audioTracks: AudioTrack[] = [];
	const selectionSets: SelectionSet[] = [];


	// Add selection set of type audio
	for (const audio in mediaGroupsAudio) {
		for (const attributes in mediaGroupsAudio[audio]) {
			const language = mediaGroupsAudio[audio][attributes].language;
			const uri = mediaGroupsAudio[audio][attributes].uri;
			const manifestUrl = formatSegmentUrl(url, uri);
			const audioManifest = await readHLS(manifestUrl);
			const audioParsed = parseM3u8(audioManifest);
			const segments: Segment[] = await formatSegments(audioParsed?.segments);
			const targetDuration = audioParsed?.targetDuration;
			// TODO: retrieve channels, samplerate, bandwidth and codec
			audioTracks.push({
				id: audio,
				type: 'AUDIO',
				codec: '',
				duration: targetDuration,
				language,
				bandwidth: 0,
				segments,
				sampleRate: 0,
				channels: 0,
			} as AudioTrack);
			audioSwitchingSets.push({ id: audio, tracks: audioTracks } as SwitchingSet);
		}
	}

	selectionSets.push({ id: uuid(), switchingSets: audioSwitchingSets } as SelectionSet);

	const textTracks: TextTrack[] = [];
	const subtitleSwitchingSets: SwitchingSet[] = [];

	// Add selection set of type subtitles
	for (const subtitle in mediaGroupsSubtitles) {
		for (const attributes in mediaGroupsSubtitles[subtitle]) {
			const language = mediaGroupsSubtitles[subtitle][attributes].language;
			const uri = mediaGroupsSubtitles[subtitle][attributes].uri;
			const manifestUrl = formatSegmentUrl(url, uri);
			const subtitleManifest = await readHLS(manifestUrl);
			const subtitleParsed = parseM3u8(subtitleManifest);
			const segments: Segment[] = await formatSegments(subtitleParsed?.segments);
			const targetDuration = subtitleParsed?.targetDuration;
			textTracks.push(
				{
					id: subtitle,
					type: 'TEXT',
					codec: '',
					duration: targetDuration,
					language,
					bandwidth: 0,
					segments,
				} as TextTrack,
			);
			subtitleSwitchingSets.push({ id: subtitle, tracks: audioTracks } as SwitchingSet);
		}
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({ id: uuid(), switchingSets: subtitleSwitchingSets } as SelectionSet);
	}

	//Add selection set of type video
	const switchingSetVideos: SwitchingSet[] = [];

	await Promise.all(playlists.map(async (playlist: any) => {
		const manifestUrl = formatSegmentUrl(url, playlist.uri);
		const hlsManifest = await readHLS(manifestUrl);
		const parsedHlsManifest = parseM3u8(hlsManifest);
		const tracks: Track[] = [];
		const segments: Segment[] = await formatSegments(parsedHlsManifest?.segments);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const targetDuration = parsedHlsManifest?.targetDuration;
		const resolution = {
			width: playlist.attributes.RESOLUTION.width,
			height: playlist.attributes.RESOLUTION.height,
		};
		tracks.push(
			{
				id: uuid(),
				type: 'VIDEO',
				codec: CODECS,
				duration: targetDuration,
				language: LANGUAGE,
				bandwidth: BANDWIDTH,
				segments,
				width: resolution.width,
				height: resolution.height,
				frameRate: playlist.attributes['FRAME-RATE'],
				par: '',
				sar: '',
				scanType: '',
			} as VideoTrack);
		switchingSetVideos.push({ id: uuid(), tracks } as SwitchingSet);
	}));

	selectionSets.push({ id: uuid(), switchingSets: switchingSetVideos } as SelectionSet);

	return { id: uuid(), selectionSets } as Presentation;

}

function hamToM3u8(presentation: Presentation): m3u8 {
	const playlists: PlayList[] = [];
	let mediaGroups: MediaGroups = { AUDIO: {} };
	const segments: SegmentHls[] = [];

	presentation.selectionSets.forEach(selectionSet => {
		selectionSet.switchingSets.forEach(switchingSet => {
			switchingSet.tracks.forEach(track => {
				if (track.type === 'VIDEO') {
					const videoTrack = track as VideoTrack;
					playlists.push({
						uri: '',
						attributes: {
							CODECS: videoTrack.codec,
							BANDWIDTH: videoTrack.bandwidth,
							FRAME_RATE: videoTrack.frameRate,
							RESOLUTION: {
								width: videoTrack.width,
								height: videoTrack.height,
							},
						},
					});
				}
				else if (track.type === 'AUDIO') {
					const mediaGroup: MediaGroups = {
						AUDIO: {
							[switchingSet.id]: {
								[track.language]: { language: track.language },
							},
						},
					};
					mediaGroups = { ...mediaGroups, ...mediaGroup };
				}
				segments.push({ duration: switchingSet.tracks[0].duration });
			});
		});
	});

	return { playlists, mediaGroups, segments };
}

async function m3u8toHamFromManifest(hlsManifest: string, baseUrl: string): Promise<Presentation> {
	return await m3u8toHam(hlsManifest, baseUrl);
}

async function m3u8toHamFromUrl(url: string): Promise<Presentation> {
	const hlsManifest: string = await readHLS(url);
	return await m3u8toHam(hlsManifest, url);
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

export { m3u8toHam, m3u8toHamFromManifest, hamToM3u8, hamToMpd, mpdToHam, m3u8toHamFromUrl };
