import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';
import { Track } from './Track.js';
import { PlayList } from './hlsManifest.js';
import { AudioTrack } from './AudioTrack.js';
import { Segment } from './Segment.js';
import { TextTrack } from './TextTrack.js';
import { VideoTrack } from './VideoTrack.js';

async function readHLS(manifestUrl: string): Promise<string> {
	const response = await fetch(manifestUrl, {
		headers: {
			'Content-Type': 'application/vnd.apple.mpegurl',
		},
	});
	return response.text();
}


export async function m3u8toHam(hlsManifest:string,url : string) : Promise<Presentation> {
	const parsedM3u8 = parseM3u8(hlsManifest);
	const playlists: PlayList[] = parsedM3u8.playlists;
	const mediaGroupsAudio = parsedM3u8.mediaGroups?.AUDIO;
	const mediaGroupsSubtitles = parsedM3u8.mediaGroups?.SUBTITLES;
	const audioSwitchingSets: SwitchingSet[] = [];
	const audioTracks : AudioTrack[] = [];
	const selectionSets: SelectionSet[] = [];
    

	// Add selection set of type audio
	for (const audio in mediaGroupsAudio) {
		for (const attributes in mediaGroupsAudio[audio]) {
			const language = mediaGroupsAudio[audio][attributes].language;
			const uri = mediaGroupsAudio[audio][attributes].uri;       
			const manifestUrl = formatSegmentUrl(url, uri);
			const audioManifest = await readHLS(manifestUrl);
			const audioParsed = parseM3u8(audioManifest);
			const segments : Segment[] = await formatSegments(audioParsed?.segments);
			const targetDuration = audioParsed?.targetDuration;
			// TODO: retrieve channels, samplerate, bandwidth and codec
			audioTracks.push(new AudioTrack(audio, '', targetDuration, language, 0, 0, 0, segments));
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
			const uri = mediaGroupsSubtitles[subtitle][attributes].uri;       
			const manifestUrl = formatSegmentUrl(url, uri);
			const subtitleManifest = await readHLS(manifestUrl);
			const subtitleParsed = parseM3u8(subtitleManifest);
			const segments : Segment[] = await formatSegments(subtitleParsed?.segments);
			const targetDuration = subtitleParsed?.targetDuration;
			textTracks.push(new TextTrack(subtitle, '', targetDuration, language, 0, segments));
			subtitleSwitchingSets.push(new SwitchingSet(subtitle, audioTracks));
		}
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push(new SelectionSet(uuid(), subtitleSwitchingSets));
	}

	//Add selection set of type video
	const switchingSetVideos: SwitchingSet[] = [];

	await Promise.all(playlists.map(async (playlist: any) => {
		const manifestUrl = formatSegmentUrl(url, playlist.uri);
		const hlsManifest = await readHLS(manifestUrl);
		const parsedHlsManifest = parseM3u8(hlsManifest);
		const tracks: Track[] = [];
		const segments : Segment[] = await formatSegments(parsedHlsManifest?.segments);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const targetDuration = parsedHlsManifest?.targetDuration;
		const resolution = { width: playlist.attributes.RESOLUTION.width, height: playlist.attributes.RESOLUTION.height };
		tracks.push(new VideoTrack(uuid(),CODECS, targetDuration, LANGUAGE, BANDWIDTH,resolution.width,resolution.height,playlist.attributes['FRAME-RATE'],segments));
		switchingSetVideos.push(new SwitchingSet(uuid(),tracks));
	}));

	selectionSets.push(new SelectionSet(uuid(), switchingSetVideos));

	return new Presentation(uuid(), selectionSets);

}


export async function m3u8toHamFromManifest(hlsManifest:string, baseUrl:string) : Promise<Presentation> {
	const hamParsed = await m3u8toHam(hlsManifest,baseUrl);
	return hamParsed;
}

export async function m3u8toHamFromUrl(url: string): Promise<Presentation> {
	const hlsManifest: string = await readHLS(url);
	const hamParsed = await m3u8toHam(hlsManifest,url);
	return hamParsed;
}

async function formatSegments(segments:any[]){
	const formattedSegments: Segment[] = [];
	await Promise.all(segments.map(async (segment:any) => {
		const { duration,uri } = segment;
		const { length, offset } = segment.byterange;
		formattedSegments.push(new Segment(duration ,uri,`${length}@${offset}`));
	}));

	return formattedSegments;
}

function formatSegmentUrl (url:string, segmentUrl:string){
	return url.split('/').slice(0, -1).join('/') + '/' + segmentUrl;
}






