import type { Segment } from '../../../types/model/Segment.ts';
import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts';
import type { VideoTrack } from '../../../types/model/VideoTrack.ts';

import type { Manifest } from '../../../types/manifest/Manifest.ts';
import type { PlayList } from '../../../types/mapper/hls/Playlist.ts';

import { FRAME_RATE_NUMERATOR_30, ZERO } from '../../../utils/constants.ts';
import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts';

import { decodeByteRange } from './utils/decodeByteRange.ts';
import { formatSegments } from './utils/formatSegments.ts';
import { getDuration } from './utils/getDuration.ts';
import { getHlsCodec } from './utils/getHlsCodec.ts';

export function videoPlaylistsToSwitchingSets(
	playlists: PlayList[],
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const switchingSetVideos: SwitchingSet[] = [];
	const videoTracks: VideoTrack[] = [];
	let videoTrackId = 0;

	playlists.map((playlist: any) => {
		const parsedHlsManifest = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		);
		const segments: Segment[] = formatSegments(parsedHlsManifest?.segments);
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes;
		const map = parsedHlsManifest?.segments?.at(0)?.map;
		const byteRange = decodeByteRange(map?.byterange);
		videoTracks.push({
			id: `video-${videoTrackId++}`,
			type: 'video',
			fileName: playlist.uri,
			codec: getHlsCodec('video', CODECS),
			duration: getDuration(parsedHlsManifest, segments),
			language: LANGUAGE ?? 'und',
			bandwidth: BANDWIDTH,
			segments: segments,
			width: playlist.attributes.RESOLUTION.width,
			height: playlist.attributes.RESOLUTION.height,
			frameRate: {
				frameRateNumerator:
					playlist.attributes['FRAME-RATE'] ??
					FRAME_RATE_NUMERATOR_30,
				frameRateDenominator: ZERO,
			},
			par: '',
			sar: '',
			scanType: '',
			...(byteRange && { byteRange }),
			...(map?.uri && { urlInitialization: map?.uri }),
		} as VideoTrack);
	});

	switchingSetVideos.push({
		id: `video`,
		tracks: videoTracks,
	} as SwitchingSet);

	return switchingSetVideos;
}
