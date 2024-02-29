import {
	AudioTrack,
	TextTrack,
	Presentation,
	VideoTrack,
} from '../../types/model';
import { Manifest } from '../../../utils/types';
import os from 'os';

function hamToHls(presentation: Presentation[]): Manifest {
	const version = 0; //TODO : save version in the model.
	const newline = os.EOL;
	let mainManifest = `#EXT3M3U ${newline} #EXT-X-VERSION:${version} ${newline}`;
	const playlists: Manifest[] = [];
	presentation.map((pres) => {
		const selectionSets = pres.selectionSets;
		selectionSets.map((selectionSet) => {
			const switchingSets = selectionSet.switchingSets;
			switchingSets.map((switchingSet) => {
				const tracks = switchingSet.tracks;
				tracks.map((track) => {
					if (track.type === 'VIDEO') {
						const { manifestToConcat, playlist } =
							_generateVideoManifestPiece(track as VideoTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'm3u8' });
					} else if (track.type === 'AUDIO') {
						const { manifestToConcat, playlist } =
							_generateAudioManifestPiece(track as AudioTrack);
						mainManifest += manifestToConcat;
						playlists.push({ manifest: playlist, type: 'm3u8' });
					} else if (track.type === 'TEXT') {
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
	const newline = os.EOL;
	const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS=${videoTrack.codec},RESOLUTION=${videoTrack.width}x${videoTrack.height}  ${newline} ${videoTrack.name} ${newline}`;
	let playlist = videoTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration}, ${newline} ${segment.url}`;
		})
		.join(newline);
	playlist = `#EXT-X-TARGETDURATION:${videoTrack.duration} ${newline} ${playlist}`;

	return { manifestToConcat, playlist };
}

function _generateAudioManifestPiece(audioTrack: AudioTrack) {
	const newline = os.EOL;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID=${audioTrack.id},NAME=${audioTrack.id},LANGUAGE=${audioTrack.language} ,URI=${audioTrack.name} ${newline}`;
	let playlist = audioTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration},\n${segment.url}`;
		})
		.join(newline);
	playlist = `#EXT-X-TARGETDURATION:${audioTrack.duration}\n${playlist}`;

	return { manifestToConcat, playlist };
}

function _generateTextManifestPiece(textTrack: TextTrack) {
	const newline = os.EOL;
	const manifestToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language} URI= ${textTrack.name} ${newline}`;
	const playlist = textTrack.segments
		.map((segment) => {
			return `#EXTINF:${segment.duration},\n${segment.url}`;
		})
		.join(newline);

	return { manifestToConcat, playlist };
}

export { hamToHls };
