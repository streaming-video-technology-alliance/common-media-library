import { parseM3u8 } from '../../../cmaf-ham.js';
import { uuid } from '../../../utils.js';
import { PlayList } from '../../utils/hls/HlsManifest.js';
import { formatSegmentsSync } from '../../utils/hls/hlsMapper.js';
import { Manifest } from '../../utils/types/index.js';
import { AudioTrack, Segment, SelectionSet , SwitchingSet ,TextTrack, VideoTrack, Presentation, Track } from '../model/index.js';
import { IMapper } from './IMapper.js';
import fs from 'fs';
import os from 'os';
export class HLSMapper implements IMapper {
	toHam(manifest: Manifest): Presentation[] {
		const mainManifestParsed = parseM3u8(manifest.main);
		const playlists: PlayList[] = mainManifestParsed.playlists;
		const mediaGroupsAudio = mainManifestParsed.mediaGroups?.AUDIO;
		const mediaGroupsSubtitles = mainManifestParsed.mediaGroups?.SUBTITLES;
		const audioSwitchingSets: SwitchingSet[] = [];
		const selectionSets: SelectionSet[] = [];
		const manifestPlaylists = manifest.playlists ? manifest.playlists : [];
		let currentPlaylist = 0;


		for (const audio in mediaGroupsAudio) {
			const audioTracks: AudioTrack[] = [];
			const attributes :any = mediaGroupsAudio[audio];
			//this is an object, how can i get keys
			const keys = Object.keys(attributes);
			const { language } = attributes[keys[0]];
			console.log(language);

			// const { language } = mediaGroupsAudio[audio][attributes];
			console.log(language);
			const audioParsed = parseM3u8(manifestPlaylists[currentPlaylist++]);
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

		selectionSets.push(new SelectionSet(uuid(), audioSwitchingSets));
		console.log('audioSwitchingSets', audioSwitchingSets);

		const subtitleSwitchingSets: SwitchingSet[] = [];

		// Add selection set of type subtitles
		for (const subtitle in mediaGroupsSubtitles) {
			const attributes = mediaGroupsSubtitles[subtitle];
			const textTracks: TextTrack[] = [];
			const keys = Object.keys(attributes);
			const { language } = attributes[keys[0]];			const subtitleParsed = parseM3u8(manifestPlaylists[currentPlaylist++]);
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
			subtitleSwitchingSets.push(new SwitchingSet(subtitle, textTracks));
		}

		if (subtitleSwitchingSets.length > 0) {
			selectionSets.push(new SelectionSet(uuid(), subtitleSwitchingSets));
		}

		//Add selection set of type video
		const switchingSetVideos: SwitchingSet[] = [];

		playlists.map(async (playlist: any) => {
			const parsedHlsManifest = parseM3u8(manifestPlaylists[currentPlaylist++]);
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

		const presentations = [new Presentation(uuid(), selectionSets)];
		return presentations;

	}

	toManifest(presentation: Presentation[]): Manifest {
		const version = 0; //TODO : save version in the model.
		const newline = os.EOL;
		let mainManifest = `#EXT3M3U ${newline} #EXT-X-VERSION:${version} ${newline}`;
		const playlists: string [] = [];
		presentation.map((pres) => {
			const selectionSets = pres.selectionSets;
			selectionSets.map((selectionSet) => {
				const switchingSets = selectionSet.switchingSet;
				switchingSets.map((switchingSet) => {
					const tracks = switchingSet.tracks;
					tracks.map((track) => {
						if (track.type === 'VIDEO') {
							const videoTrack = track as VideoTrack;
							const trackUrl = 'url'; //TODO : Save track url in the model
							const manifestToConcat = `#EXT-X-STREAM-INF:BANDWIDTH=${videoTrack.bandwidth},CODECS=${videoTrack.codec},RESOLUTION=${videoTrack.width}x${videoTrack.height}  ${newline} ${trackUrl} ${newline}`;
							mainManifest += manifestToConcat;
							let playlist = videoTrack.segments.map((segment) => {
								return `#EXTINF:${segment.duration}, ${newline} ${segment.url}`;
							}).join(newline);
							playlist = `#EXT-X-TARGETDURATION:${videoTrack.duration} ${newline} ${playlist}`;
							playlists.push(playlist);
						}
						else if (track.type === 'AUDIO') {
							const audioTrack = track as AudioTrack;
							const trackUrl = 'url'; //TODO : Save track url in the model 
							const textToConcat = `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID=${audioTrack.id},NAME=${audioTrack.id},LANGUAGE=${audioTrack.language} ,URI=${trackUrl} ${newline}`;
							mainManifest += textToConcat;
							let playlist = audioTrack.segments.map((segment) => {
								return `#EXTINF:${segment.duration},\n${segment.url}`;
							}).join(newline);
							playlist = `#EXT-X-TARGETDURATION:${audioTrack.duration}\n${playlist}`;
							playlists.push(playlist);
						}
						else if (track.type === 'TEXT') {
							const textTrack = track as TextTrack;
							const trackUrl = 'url'; //TODO : Save track url in the model
							const textToConcat = `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=${textTrack.id},NAME=${textTrack.id},LANGUAGE=${textTrack.language} URI= ${trackUrl} ${newline}`;
							mainManifest += textToConcat;
							playlists.push(textTrack.segments.map((segment) => {
								return `#EXTINF:${segment.duration},\n${segment.url}`;
							}).join(newline));
						}
					});
				});
			});
		});
		return { main: mainManifest, playlists: playlists, type: 'm3u8' };
	}
}

