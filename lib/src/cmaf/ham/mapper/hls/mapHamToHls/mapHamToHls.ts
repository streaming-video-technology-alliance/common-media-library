import type { Manifest } from '../../../types/manifest/Manifest';
import type { Presentation } from '../../../types/model/Presentation';
import type { SelectionSet } from '../../../types/model/SelectionSet';
import type { SwitchingSet } from '../../../types/model/SwitchingSet';
import type { Track } from '../../../types/model/Track';

import { generateManifestPlaylistPiece } from './generateManifestPlaylistPiece.ts';

export function mapHamToHls(presentations: Presentation[]): Manifest {
	const version = 7; //TODO Add a way to change the version. For now version 7 is hardcoded as it is the first version of HLS with CMAF support
	let mainManifest = `#EXTM3U\n#EXT-X-VERSION:${version}\n\n`;
	const playlists: Manifest[] = [];
	presentations.map((presentation: Presentation) => {
		presentation.selectionSets.map((selectionSet: SelectionSet) => {
			selectionSet.switchingSets.map((switchingSet: SwitchingSet) => {
				switchingSet.tracks.map((track: Track) => {
					const { mainRef, playlist } =
						generateManifestPlaylistPiece(track);
					mainManifest += mainRef;
					const manifestFileName =
						track.fileName ?? `${track.id}.m3u8`;
					playlists.push({
						manifest: playlist,
						type: 'hls',
						fileName: manifestFileName,
					});
				});
			});
		});
	});
	return {
		manifest: mainManifest,
		ancillaryManifests: playlists,
		type: 'hls',
	};
}
