import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	VideoTrack,
} from '../../types/model/index.js';
import type { Manifest, PlayList } from '../../types';
import { FRAME_RATE_NUMERATOR_30, ZERO } from '../../../utils/constants.js';
import { addMetadataToHls } from '../../../utils/manifestUtils.js';
import { parseHlsManifest } from '../../../utils/hls/hlsParser.js';
import {
	formatSegments,
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

	let presentationId = 0;

	return [
		{ id: (presentationId++).toString(), selectionSets: selectionSets },
	];
}

function _audioGroupsToSwitchingSets(
	mediaGroupsAudio: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const audioSwitchingSets: SwitchingSet[] = [];
	const audioTracks: AudioTrack[] = [];

	for (const audioEncodings in mediaGroupsAudio) {
		const encodings = mediaGroupsAudio[audioEncodings];
		for (const audio in encodings) {
			const attributes: any = encodings[audio];
			const { language, uri } = attributes;
			const audioParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			);
			const map = audioParsed?.segments[0]?.map;
			const segments = formatSegments(audioParsed?.segments);

			// TODO: channels, sampleRate, bandwith and codec need to be
			// updated with real values. Right now we are using simple hardcoded values.
			const byteRange = getByterange(map?.byterange);
			audioTracks.push({
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
				...(byteRange && { byteRange }),
				urlInitialization: map?.uri,
			} as AudioTrack);
		}
	}

	audioSwitchingSets.push({
		id: 'audio',
		tracks: audioTracks,
	} as SwitchingSet);

	return audioSwitchingSets;
}

function _subtitleGroupsToSwitchingSets(
	mediaGroupsSubtitles: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const subtitleSwitchingSets: SwitchingSet[] = [];
	const textTracks: TextTrack[] = [];

	// Add selection set of type subtitles
	for (const subtitleEncodings in mediaGroupsSubtitles) {
		const encodings = mediaGroupsSubtitles[subtitleEncodings];
		for (const subtitle in encodings) {
			const attributes = encodings[subtitle];
			const { language, uri } = attributes;
			const subtitleParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			);
			const segments = formatSegments(subtitleParsed?.segments);

			textTracks.push({
				id: subtitle,
				type: 'text',
				fileName: uri,
				codec: getCodec('text'),
				duration: getDuration(subtitleParsed, segments),
				language: language,
				bandwidth: 0,
				segments: segments,
			} as TextTrack);
		}
	}

	subtitleSwitchingSets.push({
		id: 'text',
		tracks: textTracks,
	} as SwitchingSet);

	return subtitleSwitchingSets;
}

function _videoPlaylistsToSwitchingSets(
	playlists: PlayList[],
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const switchingSetVideos: SwitchingSet[] = [];
	const videoTracks: VideoTrack[] = [];
	let videoTrackId = 0;

	playlists.map((playlist: any) => {
		const parsedHlsManifest = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		);
		const segments: Segment[] = formatSegments(parsedHlsManifest?.segments);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const map = parsedHlsManifest?.segments?.at(0)?.map;
		const byteRange = getByterange(map?.byterange);
		videoTracks.push({
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
			frameRate: {
				frameRateNumerator:
					playlist.attributes['FRAME-RATE'] ??
					FRAME_RATE_NUMERATOR_30,
				frameRateDenominator: ZERO,
			},
			par: '',
			sar: '',
			scanType: '',
			...(byteRange && { byteRange }),
			urlInitialization: map?.uri,
		} as VideoTrack);
	});

	switchingSetVideos.push({
		id: `video`,
		tracks: videoTracks,
	} as SwitchingSet);

	return switchingSetVideos;
}

export { mapHlsToHam };
