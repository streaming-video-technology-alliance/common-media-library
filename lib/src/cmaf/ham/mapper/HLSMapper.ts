import { parseM3u8 } from '../../../cmaf-ham.js';
import { uuid } from '../../../utils.js';
import { PlayList } from '../../utils/hls/HlsManifest.js';
import { formatSegmentsSync } from '../../utils/hls/hlsMapper.js';
import { Manifest } from '../../utils/types/index.js';
import { AudioTrack, Segment, SelectionSet , SwitchingSet ,TextTrack, VideoTrack, Presentation, Track } from '../model/index.js';
import { IMapper } from './IMapper.js';
export class HLSMapper implements IMapper {
	toHam(manifest: Manifest): Presentation[] {
		const mainManifestParsed = parseM3u8(manifest.main);
		const playlists: PlayList[] = mainManifestParsed.playlists;
		const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
		const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
		const audioSwitchingSets: SwitchingSet[] = [];
		const audioTracks: AudioTrack[] = [];
		const selectionSets: SelectionSet[] = [];
		let currentPlaylist = 0;
		const manifestPlaylists = manifest.playlists ? manifest.playlists : [];

		// Add selection set of type audio
		for (const audio in mediaGroupsAudio) {
			for (const attributes in mediaGroupsAudio[audio]) {
				const language = mediaGroupsAudio[audio][attributes].language;
				const audioParsed = parseM3u8(manifestPlaylists[currentPlaylist]);
				currentPlaylist++;
				const segments: Segment[] = formatSegmentsSync(audioParsed?.segments);
				const targetDuration = audioParsed?.targetDuration;
				// TODO: retrieve channels, samplerate, bandwidth and codec
				audioTracks.push(
					new AudioTrack(
						audio,
						'AUDIO',
						'',
						targetDuration,
						language,
						0,
						segments,
						0,
						0
					)
				);
				audioSwitchingSets.push(new SwitchingSet(audio, audioTracks));
			}
		}

		selectionSets.push(new SelectionSet(uuid(), audioSwitchingSets));

		const textTracks: TextTrack[] = [];
		const subtitleSwitchingSets: SwitchingSet[] = [];

		// Add selection set of type subtitles
		for (const subtitle in mediaGroupsSubtitles) {
			for (const attributes in mediaGroupsSubtitles[subtitle]) {
				const language = mediaGroupsSubtitles[subtitle][attributes].language;
				const subtitleParsed = parseM3u8(manifestPlaylists[currentPlaylist]);
				currentPlaylist++;
				const segments: Segment[] =  formatSegmentsSync(
					subtitleParsed?.segments
				);
				const targetDuration = subtitleParsed?.targetDuration;
				textTracks.push(
					new TextTrack(
						subtitle,
						'TEXT',
						'',
						targetDuration,
						language,
						0,
						segments
					)
				);
				subtitleSwitchingSets.push(new SwitchingSet(subtitle, audioTracks));
			}
		}

		if (subtitleSwitchingSets.length > 0) {
			selectionSets.push(new SelectionSet(uuid(), subtitleSwitchingSets));
		}

		//Add selection set of type video
		const switchingSetVideos: SwitchingSet[] = [];

		playlists.map(async (playlist: any) => {
			const parsedHlsManifest = parseM3u8(manifestPlaylists[currentPlaylist]);
			currentPlaylist++;
			const tracks: Track[] = [];
			const segments: Segment[] =  formatSegmentsSync(
				parsedHlsManifest?.segments
			);
			const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
			const targetDuration = parsedHlsManifest?.targetDuration;
			const resolution = {
				width: playlist.attributes.RESOLUTION.width,
				height: playlist.attributes.RESOLUTION.height,
			};
			tracks.push(
				new VideoTrack(
					uuid(),
					'VIDEO',
					CODECS,
					targetDuration,
					LANGUAGE,
					BANDWIDTH,
					segments,
					resolution.width,
					resolution.height,
					playlist.attributes['FRAME-RATE'],
					'',
					'',
					''
				)
			);
			switchingSetVideos.push(new SwitchingSet(uuid(), tracks));
		});

		selectionSets.push(new SelectionSet(uuid(), switchingSetVideos));

		return [new Presentation(uuid(), selectionSets)];
	}
	toManifest(presentation: Presentation[]): Manifest {
		console.log(presentation);
		throw new Error('Not implemented');
	}
}
