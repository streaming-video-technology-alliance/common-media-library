import type { Segment } from '../../../types/model/Segment.js';
import type { SwitchingSet } from '../../../types/model/SwitchingSet.js';
import type { VideoTrack } from '../../../types/model/VideoTrack.js';

import type { Manifest } from '../../../types/manifest/Manifest.js';
import type { PlayList } from '../../../types/mapper/hls/Playlist.js';

import { FRAME_RATE_NUMERATOR_30, ZERO } from '../../../utils/constants.js';
import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.js';

import { getDuration } from './utils/getDuration.js';
import { getCodec } from './utils/getCodec.js';
import { getByterange } from './utils/getByterange.js';
import { formatSegments } from './utils/formatSegments.js';

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
		const byteRange = getByterange(map?.byterange);
		videoTracks.push({
			id: `video-${videoTrackId++}`,
			type: 'video',
			fileName: playlist.uri,
			codec: getCodec('video', CODECS),
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
