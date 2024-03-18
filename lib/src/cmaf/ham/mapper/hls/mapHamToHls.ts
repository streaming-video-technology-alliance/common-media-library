import { Manifest } from '../../types';
import {
	AudioTrack,
	TextTrack,
	Presentation,
	VideoTrack,
} from '../../types/model';
import {
	NEW_LINE,
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
} from '../../../utils/constants.js';

function mapHamToHls(presentation: Presentation[]): Manifest {
	const version = 0; //TODO : save version in the model.
	let mainManifest = `#EXTM3U${NEW_LINE}#EXT-X-VERSION:${version}${NEW_LINE}`;
	const playlists: Manifest[] = [];
	presentation.map((pres) => {
		const selectionSets = pres.selectionSets;
		selectionSets.map((selectionSet) => {
			const switchingSets = selectionSet.switchingSets;
			switchingSets.map((switchingSet) => {
				const tracks = switchingSet.tracks;
				tracks.map((track) => {
					if (track.type.toLowerCase() === 'video') {
						const { manifestToConcat, playlist } =
							_generateVideoManifestPiece(track as VideoTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'm3u8' });
					} else if (track.type.toLowerCase() === 'audio') {
						const { manifestToConcat, playlist } =
							_generateAudioManifestPiece(track as AudioTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'm3u8' });
					} else if (track.type.toLowerCase() === 'text') {
						const { manifestToConcat, playlist } =
							_generateTextManifestPiece(track as TextTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'm3u8' });
					}
				});
			});
		});
	});
	return {
		manifest: mainManifest,
		ancillaryManifests: playlists,
		type: 'm3u8',
	};
}

function _generateVideoManifestPiece(videoTrack: VideoTrack) {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = videoTrack.fileName ?? `${videoTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}${NEW_LINE}${trackFileName}${NEW_LINE}`;
	let playlist = videoTrack.segments
		.map((segment) => {
			const byteRange = segment.byteRange
				? `#EXT-X-BYTERANGE:${segment.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}${NEW_LINE}`
				: '';
			const url = segment.url.replaceAll(
				WHITE_SPACE,
				WHITE_SPACE_ENCODED,
			);
			segment.url;
			return `#EXTINF:${segment.duration},${NEW_LINE}${byteRange}${NEW_LINE}${url}`;
		})
		.join(NEW_LINE);
	const firstSegmentByteRange = videoTrack.segments[0]?.byteRange;
	const videoByteRange = videoTrack.byteRange
		? `BYTERANGE:${videoTrack.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}${NEW_LINE}`
		: firstSegmentByteRange
			? `BYTERANGE:0@${Number(firstSegmentByteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR).split(AT_SEPARATOR)[0]) - 1}${NEW_LINE}`
			: '';

	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${videoTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}#EXT-X-MAP:URI="${videoTrack.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED)}",${videoByteRange}${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateAudioManifestPiece(audioTrack: AudioTrack) {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = audioTrack.fileName ?? `${audioTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${trackFileName}"${NEW_LINE}`;
	let playlist = audioTrack.segments
		.map((segment) => {
			const byteRange = segment.byteRange
				? `#EXT-X-BYTERANGE:${segment.byteRange.replace('-', '@')}${NEW_LINE}`
				: '';
			const url = segment.url.replaceAll(
				WHITE_SPACE,
				WHITE_SPACE_ENCODED,
			);
			return `#EXTINF:${segment.duration},${NEW_LINE}${byteRange}${NEW_LINE}${url}`;
		})
		.join(NEW_LINE);
	const firstSegmentByteRange = audioTrack.segments[0]?.byteRange;
	const audioByteRange = audioTrack.byteRange
		? `BYTERANGE:${audioTrack.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}${NEW_LINE}`
		: firstSegmentByteRange
			? `BYTERANGE:0@${Number(firstSegmentByteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR).split(AT_SEPARATOR)[0]) - 1}${NEW_LINE}`
			: '';

	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${audioTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}#EXT-X-MAP:URI="${audioTrack.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED)}",${audioByteRange}${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateTextManifestPiece(textTrack: TextTrack) {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = textTrack.fileName ?? `${textTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language},URI= "${trackFileName}"${NEW_LINE}`;
	let playlist = textTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration},${NEW_LINE}${segment.url}`;
		})
		.join(NEW_LINE);
	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${textTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

export { mapHamToHls };
