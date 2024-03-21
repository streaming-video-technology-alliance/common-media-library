import { parseM3u8 } from '../../../utils/hls/m3u8.js';
import { uuid } from '../../../../utils.js';
import { addMetadataToHLS } from '../../../utils/manifestUtils.js';
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
	const mainManifestParsed = parseM3u8(manifest.manifest);
	manifest = addMetadataToHLS(manifest, mainManifestParsed);
	const selectionSets: SelectionSet[] = [];
	const manifestPlaylists = manifest.ancillaryManifests ?? [];
	let currentPlaylist = 0;

	const audioSwitchingSets: SwitchingSet[] = [];

	const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
	for (const audio in mediaGroupsAudio) {
		const attributes: any = mediaGroupsAudio[audio];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const audioParsed = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const map = audioParsed.segments[0]?.map;
		// TODO: retrieve channels, samplerate, bandwidth and codec
		const audioTrack = {
			id: audio,
			type: 'AUDIO',
			fileName: uri,
			codec: '',
			duration: audioParsed?.targetDuration,
			language: language,
			bandwidth: 0,
			segments: _formatSegments(audioParsed?.segments),
			sampleRate: 0,
			channels: 0,
			byteRange: getByterange(map),
			urlInitialization: map?.uri,
		} as AudioTrack;
		audioSwitchingSets.push({
			id: audio,
			tracks: [audioTrack],
		} as SwitchingSet);
	}

	selectionSets.push({
		id: uuid(),
		switchingSets: audioSwitchingSets,
	} as SelectionSet);

	const subtitleSwitchingSets: SwitchingSet[] = [];

	// Add selection set of type subtitles
	const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
	for (const subtitle in mediaGroupsSubtitles) {
		const attributes = mediaGroupsSubtitles[subtitle];
		const keys = Object.keys(attributes);
		const { language, uri } = attributes[keys[0]];
		const subtitleParsed = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const textTrack = {
			id: subtitle,
			type: 'TEXT',
			fileName: uri,
			codec: '',
			duration: subtitleParsed?.targetDuration,
			language: language,
			bandwidth: 0,
			segments: _formatSegments(subtitleParsed?.segments),
		} as TextTrack;
		subtitleSwitchingSets.push({
			id: subtitle,
			tracks: [textTrack],
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

	mainManifestParsed.playlists.map((playlist: any) => {
		const parsedHlsManifest = parseM3u8(
			manifestPlaylists[currentPlaylist++].manifest,
		);
		const segments: Segment[] = _formatSegments(
			parsedHlsManifest?.segments,
		);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const map = parsedHlsManifest.segments[0]?.map;
		const videoTrack = {
			id: uuid(),
			type: 'VIDEO',
			fileName: playlist.uri,
			codec: CODECS,
			duration: parsedHlsManifest?.targetDuration,
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

	selectionSets.push({
		id: uuid(),
		switchingSets: switchingSetVideos,
	} as SelectionSet);

	return [{ id: uuid(), selectionSets: selectionSets }];
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
