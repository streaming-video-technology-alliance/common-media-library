import { Manifest } from '../../types';
import {
	AudioTrack,
	Presentation,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model';
import { getPlaylistData, getSegments } from './utilsHamToHls.js';

function generateManifestPlaylistPiece(track: Track): {
	manifestToConcat: string;
	playlist: string;
} {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.
	const trackFileName = track.fileName ?? `${track.id}.m3u8`;

	let manifestToConcat = '';
	let playlist = `#EXTM3U\n#EXT-X-TARGETDURATION:${track.duration}\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n`;

	if (track.type.toLowerCase() === 'video') {
		const videoTrack = track as VideoTrack;
		manifestToConcat += `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}\n${trackFileName}\n`;
		playlist += getPlaylistData(videoTrack);
	} else if (track.type.toLowerCase() === 'audio') {
		const audioTrack = track as AudioTrack;
		manifestToConcat += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${trackFileName}"\n`;
		playlist += getPlaylistData(audioTrack);
	} else if (track.type.toLowerCase() === 'text') {
		const textTrack = track as TextTrack;
		manifestToConcat += `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language} URI= ${trackFileName}\n`;
	}

	playlist += `${getSegments(track.segments)}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

function mapHamToHls(presentations: Presentation[]): Manifest {
	const version = 1; //TODO : save version in the model.
	let mainManifest = `#EXTM3U\n#EXT-X-VERSION:${version}\n\n`;
	const playlists: Manifest[] = [];
	presentations.map((presentation: Presentation) => {
		presentation.selectionSets.map((selectionSet: SelectionSet) => {
			selectionSet.switchingSets.map((switchingSet: SwitchingSet) => {
				switchingSet.tracks.map((track: Track) => {
					const { manifestToConcat, playlist } =
						generateManifestPlaylistPiece(track);
					mainManifest += manifestToConcat;
					playlists.push({ manifest: playlist, type: 'm3u8' });
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

export { mapHamToHls, generateManifestPlaylistPiece };
