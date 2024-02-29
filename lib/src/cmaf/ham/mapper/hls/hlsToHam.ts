import { parseM3u8 } from '../../../utils/hls/m3u8.js';
import { uuid } from '../../../../utils.js';
import {
	AudioTrack,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model';
import { addMetadataToHLS } from '../../../utils/manifestUtils.js';
import { Manifest } from '../../../utils/types';
import { PlayList } from '../../types/HlsManifest.js';

function hlsToHam(manifest: Manifest) {
	const mainManifestParsed = parseM3u8(manifest.manifest);
	manifest = addMetadataToHLS(manifest, mainManifestParsed);
	const playlists: PlayList[] = mainManifestParsed.playlists;
	const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
	const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
	const audioSwitchingSets: SwitchingSet[] = [];
	const selectionSets: SelectionSet[] = [];
	const manifestPlaylists = manifest.ancillaryManifests
		? manifest.ancillaryManifests
		: [];
	let currentPlaylist = 0;

	for (const audio in mediaGroupsAudio) {
		const audioTracks: AudioTrack[] = [];
		const attributes: any = mediaGroupsAudio[audio];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const audioParsed = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const segments: Segment[] = _formatSegments(audioParsed?.segments);
		const targetDuration = audioParsed?.targetDuration;
		// TODO: retrieve channels, samplerate, bandwidth and codec
		audioTracks.push({
			id: audio,
			type: 'AUDIO',
			name: uri,
			codec: '',
			duration: targetDuration,
			language: language,
			bandwidth: 0,
			segments: segments,
			sampleRate: 0,
			channels: 0,
		} as AudioTrack);
		audioSwitchingSets.push({
			id: audio,
			tracks: audioTracks,
		} as SwitchingSet);
	}

	selectionSets.push({
		id: uuid(),
		switchingSets: audioSwitchingSets,
	} as SelectionSet);

	const subtitleSwitchingSets: SwitchingSet[] = [];

	// Add selection set of type subtitles
	for (const subtitle in mediaGroupsSubtitles) {
		const attributes = mediaGroupsSubtitles[subtitle];
		const textTracks: TextTrack[] = [];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const subtitleParsed = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const segments: Segment[] = _formatSegments(subtitleParsed?.segments);
		const targetDuration = subtitleParsed?.targetDuration;
		textTracks.push({
			id: subtitle,
			type: 'TEXT',
			name: uri,
			codec: '',
			duration: targetDuration,
			language: language,
			bandwidth: 0,
			segments: segments,
		} as TextTrack);
		subtitleSwitchingSets.push({
			id: subtitle,
			tracks: textTracks,
		} as SwitchingSet);
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({
			id: uuid(),
			switchingSets: subtitleSwitchingSets,
		} as SelectionSet);
	}

	//Add selection set of type video
	const switchingSetVideos: SwitchingSet[] = [];

	playlists.map(async (playlist: any) => {
		const parsedHlsManifest = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const tracks: Track[] = [];
		const segments: Segment[] = _formatSegments(
			parsedHlsManifest?.segments,
		);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const targetDuration = parsedHlsManifest?.targetDuration;
		const resolution = {
			width: playlist.attributes.RESOLUTION.width,
			height: playlist.attributes.RESOLUTION.height,
		};
		tracks.push({
			id: uuid(),
			type: 'VIDEO',
			name: playlist.uri,
			codec: CODECS,
			duration: targetDuration,
			language: LANGUAGE,
			bandwidth: BANDWIDTH,
			segments: segments,
			width: resolution.width,
			height: resolution.height,
			frameRate: playlist.attributes['FRAME-RATE'],
			par: '',
			sar: '',
			scanType: '',
		} as VideoTrack);

		switchingSetVideos.push({
			id: uuid(),
			tracks: tracks,
		} as SwitchingSet);
	});

	selectionSets.push({
		id: uuid(),
		switchingSets: switchingSetVideos,
	} as SelectionSet);

	return [{ id: uuid(), selectionSets: selectionSets }];
}

function _formatSegments(segments: any[]) {
	const formattedSegments: Segment[] = [];
	segments.map(async (segment: any) => {
		const { duration, uri } = segment;
		const { length, offset } = segment.byterange
			? segment.byterange
			: { length: 0, offset: 0 };
		formattedSegments.push({
			duration: duration,
			url: uri,
			byteRange: `${length}@${offset}`,
		} as Segment);
	});

	return formattedSegments;
}

export { hlsToHam };
