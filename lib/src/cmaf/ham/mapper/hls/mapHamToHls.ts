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
	const trackFileName = videoTrack.fileName
		? videoTrack.fileName
		: `${videoTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}${NEW_LINE}${trackFileName}${NEW_LINE}`;
	let playlist = videoTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined && segment.byteRange != ''
					? `#EXT-X-BYTERANGE:${segment.byteRange}${NEW_LINE}`
					: '';
			const url = segment.url.includes(WHITE_SPACE)
				? segment.url.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED)
				: segment.url;
			return `#EXTINF:${segment.duration},${NEW_LINE}${byteRange}${NEW_LINE}${url}`;
		})
		.join(NEW_LINE);
	const videoByteRange = videoTrack.byteRange
		? `#EXT-X-BYTERANGE:${videoTrack.byteRange.replace('-', '@')}${NEW_LINE}`
		: '';

	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${videoTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}#EXT-X-MAP:URI="${videoTrack.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED)}",${videoByteRange}${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateAudioManifestPiece(audioTrack: AudioTrack) {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = audioTrack.fileName
		? audioTrack.fileName
		: `${audioTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${trackFileName}"${NEW_LINE}`;
	let playlist = audioTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined && !!segment.byteRange
					? `#EXT-X-BYTERANGE:${segment.byteRange}${NEW_LINE}`
					: '';
			const url = segment.url.includes(WHITE_SPACE)
				? segment.url.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED)
				: segment.url;
			return `#EXTINF:${segment.duration},${NEW_LINE}${byteRange}${NEW_LINE}${url}`;
		})
		.join(NEW_LINE);
	const videoByteRange = audioTrack.byteRange
		? `#EXT-X-BYTERANGE:${audioTrack.byteRange.replace('-', '@')}${NEW_LINE}`
		: '';
	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${audioTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}#EXT-X-MAP:URI="${audioTrack.urlInitialization?.replaceAll(' ', '%20')}",${videoByteRange}"${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateTextManifestPiece(textTrack: TextTrack) {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = textTrack.fileName
		? textTrack.fileName
		: `${textTrack.id}.m3u8`;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language},URI= "${trackFileName}$"{NEW_LINE}`;
	let playlist = textTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration},${NEW_LINE}${segment.url}`;
		})
		.join(NEW_LINE);
	playlist = `#EXTM3U${NEW_LINE}#EXT-X-TARGETDURATION:${textTrack.duration}${NEW_LINE}#EXT-X-PLAYLIST-TYPE:VOD${NEW_LINE}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${NEW_LINE}${playlist}${NEW_LINE}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

export { mapHamToHls };
