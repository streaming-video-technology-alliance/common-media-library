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
						playlists.push({ manifest: playlist, type: 'hls' });
					} else if (track.type.toLowerCase() === 'audio') {
						const { manifestToConcat, playlist } =
							_generateAudioManifestPiece(track as AudioTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'hls' });
					} else if (track.type.toLowerCase() === 'text') {
						const { manifestToConcat, playlist } =
							_generateTextManifestPiece(track as TextTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'hls' });
					}
				});
			});
		});
	});
	return {
		manifest: mainManifest,
		ancillaryManifests: playlists,
		type: 'hls',
	};
}

function _generateVideoManifestPiece(videoTrack: VideoTrack) {
	const newline = `\n`;
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}${newline}${videoTrack.name}${newline}`;
	let playlist = videoTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined
					? `#EXT-X-BYTERANGE:${segment.byteRange}${newline}`
					: '';
			return `#EXTINF:${segment.duration},${newline}${byteRange}${newline}${segment.url}`;
		})
		.join(newline);
	const videoByteRange = videoTrack.byteRange
		? `#EXT-X-BYTERANGE:${videoTrack.byteRange}${newline}`
		: '';
	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${videoTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}#EXT-X-MAP:URI="${videoTrack.urlInitialization}",${videoByteRange}${newline}${playlist}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function _generateAudioManifestPiece(audioTrack: AudioTrack) {
	const newline = `\n`;
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${audioTrack.name}"${newline}`;
	let playlist = audioTrack.segments
		.map((segment) => {
			const byteRange =
				segment.byteRange != undefined
					? `#EXT-X-BYTERANGE:${segment.byteRange}${newline}`
					: '';
			return `#EXTINF:${segment.duration},${newline}${byteRange}${newline}${segment.url}`;
		})
		.join(newline);
	const videoByteRange = audioTrack.byteRange
		? `#EXT-X-BYTERANGE:${audioTrack.byteRange}${newline}`
		: '';
	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${audioTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}#EXT-X-MAP:URI="${audioTrack.urlInitialization}",${videoByteRange}"${newline}${playlist}#EXT-X-ENDLIST`;

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
	playlist = `#EXTM3U${newline}#EXT-X-TARGETDURATION:${textTrack.duration}${newline}#EXT-X-PLAYLIST-TYPE:VOD${newline}#EXT-X-MEDIA-SEQUENCE:${mediaSequence}${newline}${playlist}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

export { mapHamToHls };
