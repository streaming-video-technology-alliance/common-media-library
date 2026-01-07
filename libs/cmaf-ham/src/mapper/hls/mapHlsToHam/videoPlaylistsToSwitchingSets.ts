import type { Segment } from '../../../types/model/Segment.ts'
import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts'
import type { VideoTrack } from '../../../types/model/VideoTrack.ts'

import type { ManifestFile } from '../../../types/manifest/ManifestFile.ts'
import type { PlayList } from '../../../types/mapper/hls/Playlist.ts'

import { FRAME_RATE_NUMERATOR_30, ZERO } from '../../../utils/constants.ts'
import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts'

import { decodeByteRange } from './utils/decodeByteRange.ts'
import { formatSegments } from './utils/formatSegments.ts'
import { getDuration } from './utils/getDuration.ts'
import { getHlsCodec } from './utils/getHlsCodec.ts'

export function videoPlaylistsToSwitchingSets(
	playlists: PlayList[],
	manifestPlaylists: ManifestFile[],
): SwitchingSet[] {
	const switchingSetVideos: SwitchingSet[] = []
	const videoTracks: VideoTrack[] = []
	let videoTrackId = 0

	playlists.map((playlist: any) => {
		const parsedHlsManifest = parseHlsManifest(
			manifestPlaylists.shift()?.manifest,
		)
		const segments: Segment[] = formatSegments(parsedHlsManifest?.segments)
		const { LANGUAGE, CODECS, BANDWIDTH } = playlist.attributes
		const map = parsedHlsManifest?.segments?.at(0)?.map
		const byteRange = decodeByteRange(map?.byterange)
		const codec = getHlsCodec('video', CODECS)
		videoTracks.push({
			id: `video-${videoTrackId++}`,
			type: 'video',
			url: playlist.uri,
			codecs: codec ? [codec] : [],
			mimeType: 'video/mp4',
			duration: getDuration(parsedHlsManifest, segments),
			language: LANGUAGE,
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
			initialization: {
				url: map?.uri ?? '',
				...(byteRange && { byteRange }),
			},
			baseUrls: [],
		} as VideoTrack)
	})

	switchingSetVideos.push({
		id: `video`,
		tracks: videoTracks,
		baseUrls: [],
	} as SwitchingSet)

	return switchingSetVideos
}
