import type { ManifestFile } from '../../../types/manifest/ManifestFile.ts'
import type { Presentation } from '../../../types/model/Presentation.ts'
import type { SelectionSet } from '../../../types/model/SelectionSet.ts'
import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts'
import type { Track } from '../../../types/model/Track.ts'

import { generateManifestPlaylistPiece } from './generateManifestPlaylistPiece.ts'

export function mapHamToHls(presentations: Presentation[]): ManifestFile {
	const version = 7 //TODO Add a way to change the version. For now version 7 is hardcoded as it is the first version of HLS with CMAF support
	let mainManifest = `#EXTM3U\n#EXT-X-VERSION:${version}\n\n`
	const playlists: ManifestFile[] = []
	presentations.map((presentation: Presentation) => {
		presentation.selectionSets.map((selectionSet: SelectionSet) => {
			selectionSet.switchingSets.map((switchingSet: SwitchingSet) => {
				switchingSet.tracks.map((track: Track) => {
					const { mainRef, playlist } =
						generateManifestPlaylistPiece(track)
					mainManifest += mainRef
					const manifestFileName =
						track.url ?? `${track.id}.m3u8`
					playlists.push({
						manifest: playlist,
						type: 'hls',
						fileName: manifestFileName,
					})
				})
			})
		})
	})
	return {
		manifest: mainManifest,
		ancillaryManifests: playlists,
		type: 'hls',
	}
}
