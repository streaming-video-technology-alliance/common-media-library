import { parseHlsManifest } from '../../../utils/hls/hlsParser.js';
import { addMetadataToHls } from '../../../utils/manifestUtils.js';
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

// TODO: remove uuid
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
			// Using codec mp4a.40.2 for now, we should retrieve it by finding
			// the video playlist that is related to this audio group.
			codec: 'mp4a.40.2',
			duration: audioParsed?.targetDuration * segments.length,
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
			codec: '',
			duration: subtitleParsed?.targetDuration * segments.length,
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
		const map = parsedHlsManifest?.segments?.indexOf(0)?.map;
		const videoTrack = {
			id: `video-${videoTrackId++}`,
			type: 'video',
			fileName: playlist.uri,
			// CODECS could be a comma separated value
			// where it has video and audio codec. Using
			// position zero for now. TODO: Get the correct video codec.
			codec: CODECS.split(',').at(0),
			duration: parsedHlsManifest?.targetDuration * segments.length,
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

function getByterange(byteRange: {
	length: string;
	offset: string;
}): string | undefined {
	return byteRange ? `${byteRange.length}@${byteRange.offset}` : undefined;
}

function _formatSegments(segments: any[]): Segment[] {
	return (
		segments?.map((segment: any) => {
			return {
				duration: segment.duration,
				url: segment.uri,
				byteRange: getByterange(segment?.byterange),
			} as Segment;
		}) ?? []
	);
}

export { mapHlsToHam };
