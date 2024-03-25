import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	VideoTrack,
} from '../../types/model';
import type { Manifest, PlayList } from '../../types';
import { addMetadataToHls } from '../../../utils/manifestUtils.js';
import { parseHlsManifest } from '../../../utils/hls/hlsParser.js';
import {
	_formatSegments,
	getByterange,
	getCodec,
	getDuration,
} from './utilsHlsToHam.js';

function mapHlsToHam(manifest: Manifest): Presentation[] {
	const mainManifestParsed = parseHlsManifest(manifest.manifest);
	const manifestHls = addMetadataToHls(manifest, mainManifestParsed);
	const selectionSets: SelectionSet[] = [];
	const manifestPlaylists = manifestHls.ancillaryManifests
		? [...manifestHls.ancillaryManifests]
		: [];

	const audioSwitchingSets = _audioGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.AUDIO,
		manifestPlaylists,
	);
	const subtitleSwitchingSets = _subtitleGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.SUBTITLES,
		manifestPlaylists,
	);
	const videoSwitchingSets = _videoPlaylistsToSwitchingSets(
		mainManifestParsed.playlists,
		manifestPlaylists,
	);

	let selectionSetId = 0;

	if (audioSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: audioSwitchingSets,
		} as SelectionSet);
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: subtitleSwitchingSets,
		} as SelectionSet);
	}

	if (videoSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: videoSwitchingSets,
		} as SelectionSet);
	}

	return [{ id: '0', selectionSets: selectionSets }];
}

function _audioGroupsToSwitchingSets(
	mediaGroupsAudio: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const audioSwitchingSets: SwitchingSet[] = [];

	for (const audio in mediaGroupsAudio) {
		const attributes: any = mediaGroupsAudio[audio];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const audioParsed = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		);
		const map = audioParsed?.segments[0]?.map;
		const segments = _formatSegments(audioParsed?.segments);

		// TODO: channels, sampleRate, bandwith and codec need to be
		// updated with real values. Right now we are using simple hardcoded values.
		const audioTrack = {
			id: audio,
			type: 'audio',
			fileName: uri,
			codec: getCodec('audio'),
			duration: getDuration(audioParsed, segments),
			language: language,
			bandwidth: 0,
			segments: segments,
			sampleRate: 0,
			channels: 2,
			byteRange: getByterange(map?.byterange),
			urlInitialization: map?.uri,
		} as AudioTrack;
		audioSwitchingSets.push({
			id: audio,
			tracks: [audioTrack],
		} as SwitchingSet);
	}

	return audioSwitchingSets;
}

function _subtitleGroupsToSwitchingSets(
	mediaGroupsSubtitles: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const subtitleSwitchingSets: SwitchingSet[] = [];

	// Add selection set of type subtitles
	for (const subtitle in mediaGroupsSubtitles) {
		const attributes = mediaGroupsSubtitles[subtitle];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const subtitleParsed = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		);
		const segments = _formatSegments(subtitleParsed?.segments);

		const textTrack = {
			id: subtitle,
			type: 'text',
			fileName: uri,
			codec: getCodec('text'),
			duration: getDuration(subtitleParsed, segments),
			language: language,
			bandwidth: 0,
			segments: segments,
		} as TextTrack;
		subtitleSwitchingSets.push({
			id: subtitle,
			tracks: [textTrack],
		} as SwitchingSet);
	}

	return subtitleSwitchingSets;
}

function _videoPlaylistsToSwitchingSets(
	playlists: PlayList[],
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const switchingSetVideos: SwitchingSet[] = [];
	let videoTrackId = 0;
	let videoSwitchingSetId = 0;

	playlists.map((playlist: any) => {
		const parsedHlsManifest = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		);
		const segments: Segment[] = _formatSegments(
			parsedHlsManifest?.segments,
		);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const map = parsedHlsManifest?.segments?.at(0)?.map;
		const videoTrack = {
			id: `video-${videoTrackId++}`,
			type: 'video',
			fileName: playlist.uri,
			codec: getCodec('video', CODECS),
			duration: getDuration(parsedHlsManifest, segments),
			language: LANGUAGE ?? 'und',
			bandwidth: BANDWIDTH,
			segments: segments,
			width: playlist.attributes.RESOLUTION.width,
			height: playlist.attributes.RESOLUTION.height,
			frameRate: playlist.attributes['FRAME-RATE'],
			par: '',
			sar: '',
			scanType: '',
			byteRange: getByterange(map?.byterange),
			urlInitialization: map?.uri,
		} as VideoTrack;

		switchingSetVideos.push({
			id: `video-${videoSwitchingSetId++}`,
			tracks: [videoTrack],
		} as SwitchingSet);
	});

	return switchingSetVideos;
}

export { mapHlsToHam };
