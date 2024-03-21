import { parseM3u8 } from '../../../utils/hls/m3u8.js';
import { uuid } from '../../../../utils.js';
import { addMetadataToHLS } from '../../../utils/manifestUtils.js';
import type {
	AudioTrack,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model';
import type { Manifest, PlayList } from '../../types';

function mapHlsToHam(manifest: Manifest) {
	const mainManifestParsed = parseM3u8(manifest.manifest);
	manifest = addMetadataToHLS(manifest, mainManifestParsed);
	const playlists: PlayList[] = mainManifestParsed.playlists;
	const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
	const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
	const manifestPlaylists = manifest.ancillaryManifests
		? [...manifest.ancillaryManifests]
		: [];
	const selectionSets: SelectionSet[] = [];

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

	for (const audio in mediaGroupsAudio) {
		const audioTracks: AudioTrack[] = [];
		const attributes: any = mediaGroupsAudio[audio];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const audioParsed = parseM3u8(manifestPlaylists.shift()!.manifest);
		const segments: Segment[] = _formatSegments(audioParsed?.segments);
		const targetDuration = audioParsed?.targetDuration;
		const map = audioParsed.segments[0]?.map;
		const byteRange =
			map && map.byterange
				? `${map.byterange.length}@${map.byterange.offset}`
				: undefined;
		// TODO: channels, sampleRate, bandwith and codec need to be
		// updated with real values. Right now we are using simple hardcoded values.
		audioTracks.push({
			id: audio,
			type: 'audio',
			name: uri,
			// Using codec mp4a.40.2 for now, we should retrieve it by finding
			// the video playlist that is related to this audio group.
			codec: 'mp4a.40.2',
			duration: targetDuration * segments.length,
			language: language,
			bandwidth: 0,
			segments: segments,
			sampleRate: 0,
			channels: 2,
			byteRange: byteRange,
			urlInitialization: map?.uri,
		} as AudioTrack);
		audioSwitchingSets.push({
			id: audio,
			tracks: audioTracks,
		} as SwitchingSet);
	}

	return audioSwitchingSets;
}

function _subtitleGroupsToSwitchingSets(
	mediaGroupsSubtitles: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const subtitleSwitchingSets: SwitchingSet[] = [];

	for (const subtitle in mediaGroupsSubtitles) {
		const attributes = mediaGroupsSubtitles[subtitle];
		const textTracks: TextTrack[] = [];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const subtitleParsed = parseM3u8(manifestPlaylists.shift()!.manifest);
		const segments: Segment[] = _formatSegments(subtitleParsed?.segments);
		const targetDuration = subtitleParsed?.targetDuration;
		textTracks.push({
			id: subtitle,
			type: 'text',
			name: uri,
			codec: '',
			duration: targetDuration * segments.length,
			language: language,
			bandwidth: 0,
			segments: segments,
		} as TextTrack);
		subtitleSwitchingSets.push({
			id: subtitle,
			tracks: textTracks,
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
		const parsedHlsManifest = parseM3u8(
			manifestPlaylists.shift()!.manifest,
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
		const map = parsedHlsManifest.segments[0]?.map;
		const byterange = map?.byterange;
		// CODECS could be a comma separated value
		// where it has video and audio codec. Using
		// position zero for now. TODO: Get the correct video codec.
		const codec = CODECS.split(',').at(0);
		tracks.push({
			id: uuid(),
			type: 'video',
			name: playlist.uri,
			codec,
			duration: targetDuration * segments.length,
			language: LANGUAGE,
			bandwidth: BANDWIDTH,
			segments: segments,
			width: resolution.width,
			height: resolution.height,
			frameRate: playlist.attributes['FRAME-RATE'],
			par: '',
			sar: '',
			scanType: '',
			byteRange: byterange
				? `${byterange.length}@${byterange.offset}`
				: undefined,
			urlInitialization: map?.uri,
		} as VideoTrack);

		switchingSetVideos.push({
			id: uuid(),
			tracks: tracks,
		} as SwitchingSet);
	});

	return switchingSetVideos;
}

function _formatSegments(segments: any[]) {
	const formattedSegments: Segment[] = [];
	segments.map((segment: any) => {
		const { duration, uri } = segment;
		const { length, offset } = segment.byterange
			? segment.byterange
			: { length: 0, offset: 0 };
		formattedSegments.push({
			duration: duration,
			url: uri,
			byteRange: length ? `${length}@${offset}` : undefined,
		} as Segment);
	});

	return formattedSegments;
}

export { mapHlsToHam };
