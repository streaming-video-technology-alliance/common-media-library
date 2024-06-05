import type { Manifest } from '../../../types/manifest/Manifest.js';
import type { Presentation } from '../../../types/model/Presentation.js';
import type { SelectionSet } from '../../../types/model/SelectionSet.js';
import type { SwitchingSet } from '../../../types/model/SwitchingSet.js';
import type { Track } from '../../../types/model/Track.js';

import { generateManifestPlaylistPiece } from './generateManifestPlaylistPiece.js';

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
