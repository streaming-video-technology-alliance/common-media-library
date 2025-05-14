import type { Presentation } from '../../../types/model/Presentation';
import type { SelectionSet } from '../../../types/model/SelectionSet';

import type { Manifest } from '../../../types/manifest/Manifest';

import { audioGroupsToSwitchingSets } from './audioGroupsToSwitchingSets.ts';
import { subtitleGroupsToSwitchingSets } from './subtitleGroupsToSwitchingSets.ts';
import { videoPlaylistsToSwitchingSets } from './videoPlaylistsToSwitchingSets.ts';

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts';
import { addMetadataToHls } from '../../../utils/manifest/addMetadataToHls.ts';

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
