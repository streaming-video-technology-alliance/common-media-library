import type { Presentation } from '../../../types/model/Presentation.js';
import type { SelectionSet } from '../../../types/model/SelectionSet.js';

import type { Manifest } from '../../../types/manifest/Manifest.js';

import { audioGroupsToSwitchingSets } from './audioGroupsToSwitchingSets.js';
import { subtitleGroupsToSwitchingSets } from './subtitleGroupsToSwitchingSets.js';
import { videoPlaylistsToSwitchingSets } from './videoPlaylistsToSwitchingSets.js';

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.js';
import { addMetadataToHls } from '../../../utils/manifest/addMetadataToHls.js';

export function mapHlsToHam(manifest: Manifest): Presentation[] {
	const mainManifestParsed = parseHlsManifest(manifest.manifest);
	const manifestHls = addMetadataToHls(manifest, mainManifestParsed);
	const selectionSets: SelectionSet[] = [];
	const manifestPlaylists = manifestHls.ancillaryManifests
		? [...manifestHls.ancillaryManifests]
		: [];

	const audioSwitchingSets = audioGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.AUDIO,
		manifestPlaylists,
	);
	const subtitleSwitchingSets = subtitleGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.SUBTITLES,
		manifestPlaylists,
	);
	const videoSwitchingSets = videoPlaylistsToSwitchingSets(
		mainManifestParsed.playlists,
		manifestPlaylists,
	);

	let selectionSetId = 0;

	if (audioSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: audioSwitchingSets,
		} as SelectionSet);
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: subtitleSwitchingSets,
		} as SelectionSet);
	}

	if (videoSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: videoSwitchingSets,
		} as SelectionSet);
	}

	let presentationId = 0;

	return [
		{ id: (presentationId++).toString(), selectionSets: selectionSets },
	];
}
