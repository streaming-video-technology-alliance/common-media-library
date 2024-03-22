import { parseHlsManifest } from '../../../utils/hls/hlsParser.js';
import { uuid } from '../../../../utils.js';
import { addMetadataToHls } from '../../../utils/manifestUtils.js';
import type {
	AudioTrack,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	VideoTrack,
} from '../../types/model';
import type { Manifest } from '../../types';

// TODO: remove uuid
function mapHlsToHam(manifest: Manifest) {
	const mainManifestParsed = parseHlsManifest(manifest.manifest);
	manifest = addMetadataToHls(manifest, mainManifestParsed);
	const selectionSets: SelectionSet[] = [];
	const manifestPlaylists = [...manifest.ancillaryManifests] ?? [];

	const audioSwitchingSets = _audioGroupsToSwitchingSets(
		mediaGroupsAudio,
		manifestPlaylists,
	);
	const subtitleSwitchingSets = _subtitleGroupsToSwitchingSets(
		mediaGroupsSubtitles,
		manifestPlaylists,
	);
	const videoSwitchingSets = _videoPlaylistsToSwitchingSets(
		playlists,
		manifestPlaylists,
	);

	if (audioSwitchingSets.length > 0) {
		selectionSets.push({
			id: uuid(),
			switchingSets: audioSwitchingSets,
		} as SelectionSet);
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({
			id: uuid(),
			switchingSets: subtitleSwitchingSets,
		} as SelectionSet);
	}

	if (videoSwitchingSets.length > 0) {
		selectionSets.push({
			id: uuid(),
			switchingSets: videoSwitchingSets,
		} as SelectionSet);
	}

	return [{ id: uuid(), selectionSets: selectionSets }];
}

function _audioGroupsToSwitchingSets(
	mediaGroupsAudio: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const audioSwitchingSets: SwitchingSet[] = [];

	const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
	for (const audio in mediaGroupsAudio) {
		const attributes: any = mediaGroupsAudio[audio];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const audioParsed = parseHlsManifest(
			manifestPlaylists.shift()!.manifest,
		);
		const map = audioParsed.segments[0]?.map;
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
			segments: _formatSegments(audioParsed?.segments),
			sampleRate: 0,
			channels: 2,
			byteRange: getByterange(map),
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
	const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
	for (const subtitle in mediaGroupsSubtitles) {
		const attributes = mediaGroupsSubtitles[subtitle];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const subtitleParsed = parseHlsManifest(
			manifestPlaylists.shift()!.manifest,
		);
		const textTrack = {
			id: subtitle,
			type: 'text',
			fileName: uri,
			codec: '',
			duration: subtitleParsed?.targetDuration * segments.length,
			language: language,
			bandwidth: 0,
			segments: _formatSegments(subtitleParsed?.segments),
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

	playlists.map((playlist: any) => {
		const parsedHlsManifest = parseHlsManifest(
			manifestPlaylists.shift()!.manifest,
		);
		const segments: Segment[] = _formatSegments(
			parsedHlsManifest?.segments,
		);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const map = parsedHlsManifest.segments[0]?.map;
		const videoTrack = {
			id: uuid(),
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
			byteRange: getByterange(map),
			urlInitialization: map?.uri,
		} as VideoTrack;

		switchingSetVideos.push({
			id: uuid(),
			tracks: [videoTrack],
		} as SwitchingSet);
	});

	return switchingSetVideos;
}

function getByterange(element: any): string | undefined {
	return element.byteRange
		? `${element.byterange.length}@${element.byterange.offset}`
		: undefined;
}

function _formatSegments(segments: any[]): Segment[] {
	const formattedSegments: Segment[] = [];
	segments.map((segment: any) => {
		formattedSegments.push({
			duration: segment.duration,
			url: segment.uri,
			byteRange: getByterange(segment),
		} as Segment);
	});

	return formattedSegments;
}

export { mapHlsToHam };
