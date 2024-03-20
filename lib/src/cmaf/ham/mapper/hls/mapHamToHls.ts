import { Manifest } from '../../types';
import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model';

function mapHamToHls(presentations: Presentation[]): Manifest {
	const version = 1; //TODO : save version in the model.
	let mainManifest = `#EXTM3U\n#EXT-X-VERSION:${version}\n`;
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

function getSegments(segments: Segment[]): string {
	return segments
		.map((segment: Segment): string => {
			const byteRange: string = segment.byteRange
				? `#EXT-X-BYTERANGE:${segment.byteRange}\n`
				: '';
			return `#EXTINF:${segment.duration},\n${byteRange}\n${segment.url}`;
		})
		.join('\n');
}

function getByterange(track: VideoTrack | AudioTrack): string {
	return track.byteRange ? `#EXT-X-BYTERANGE:${track.byteRange}\n` : '';
}

function generateManifestPlaylistPiece(track: Track): {
	manifestToConcat: string;
	playlist: string;
} {
	const mediaSequence = 0; //TODO : save mediaSequence in the model.

	let manifestToConcat = '';
	let playlist = `#EXTM3U\n#EXT-X-TARGETDURATION:${track.duration}\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n`;

	if (track.type.toLowerCase() === 'video') {
		const videoTrack = track as VideoTrack;
		manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS="${videoTrack.codec}",RESOLUTION=${videoTrack.width}x${videoTrack.height}\n${videoTrack.name}\n`;
		playlist += `#EXT-X-MAP:URI="${videoTrack.urlInitialization}",${getByterange(videoTrack)}\n`;
	} else if (track.type.toLowerCase() === 'audio') {
		const audioTrack = track as AudioTrack;
		manifestToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="${audioTrack.id}",LANGUAGE="${audioTrack.language}",NAME="${audioTrack.id}",URI="${audioTrack.name}"\n`;
		playlist += `#EXT-X-MAP:URI="${audioTrack.urlInitialization}",${getByterange(audioTrack)}\n`;
	} else if (track.type.toLowerCase() === 'text') {
		const textTrack = track as TextTrack;
		manifestToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language} URI= ${textTrack.name}\n`;
	}

	playlist += `${getSegments(track.segments)}#EXT-X-ENDLIST`;

	return { manifestToConcat, playlist };
}

export { mapHamToHls };
