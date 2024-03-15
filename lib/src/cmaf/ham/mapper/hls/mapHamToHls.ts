import { Manifest } from '../../types';
import {
	AudioTrack,
	TextTrack,
	Presentation,
	VideoTrack,
} from '../../types/model';

function mapHamToHls(presentation: Presentation[]): Manifest {
	const version = 0; //TODO : save version in the model.
	const newline = `\n`;
	let mainManifest = `#EXTM3U${newline}#EXT-X-VERSION:${version}${newline}`;
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
	const newline = `\n`;
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}${newline}${videoTrack.name}${newline}`;
	let playlist = videoTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined && segment.byteRange != ''
					? `#EXT-X-BYTERANGE:${segment.byteRange}${newline}`
					: '';
			const url = segment.url.includes(' ')
				? segment.url.replaceAll(' ', '%20')
				: segment.url;
			return `#EXTINF:${segment.duration},${newline}${byteRange}${newline}${url}`;
		})
		.join(newline);
	const videoByteRange = videoTrack.byteRange
		? `#EXT-X-BYTERANGE:${videoTrack.byteRange.replace('-', '@')}${newline}`
		: '';

	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${videoTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}#EXT-X-MAP:URI="${videoTrack.urlInitialization?.replaceAll(' ','%20')}",${videoByteRange}${newline}${playlist}${newline}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateAudioManifestPiece(audioTrack: AudioTrack) {
	const newline = `\n`;
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${audioTrack.name}"${newline}`;
	let playlist = audioTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined && segment.byteRange != ''
					? `#EXT-X-BYTERANGE:${segment.byteRange}${newline}`
					: '';
			//If there is a space in the uri, add %20 to the uri
			const url = segment.url.includes(' ')
				? segment.url.replaceAll(' ', '%20')
				: segment.url;
			return `#EXTINF:${segment.duration},${newline}${byteRange}${newline}${url}`;
		})
		.join(newline);
	const videoByteRange = audioTrack.byteRange
		? `#EXT-X-BYTERANGE:${audioTrack.byteRange.replace('-', '@')}${newline}`
		: '';
	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${audioTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}#EXT-X-MAP:URI="${audioTrack.urlInitialization?.replaceAll(' ','%20')}",${videoByteRange}"${newline}${playlist}${newline}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateTextManifestPiece(textTrack: TextTrack) {
	const newline = `\n`;
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language} URI= ${textTrack.name}${newline}`;
	let playlist = textTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration},\n${segment.url}`;
		})
		.join(newline);
	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${textTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}${playlist}${newline}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

export { mapHamToHls };
