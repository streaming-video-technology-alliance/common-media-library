import type { Presentation } from '../../../types/model/Presentation.ts'
import type { SelectionSet } from '../../../types/model/SelectionSet.ts'

import type { ManifestFile } from '../../../types/manifest/ManifestFile.ts'

import { audioGroupsToSwitchingSets } from './audioGroupsToSwitchingSets.ts'
import { subtitleGroupsToSwitchingSets } from './subtitleGroupsToSwitchingSets.ts'
import { videoPlaylistsToSwitchingSets } from './videoPlaylistsToSwitchingSets.ts'

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts'
import { addMetadataToHls } from '../../../utils/manifest/addMetadataToHls.ts'

export function mapHlsToHam(manifest: ManifestFile): Presentation[] {
	const mainManifestParsed = parseHlsManifest(manifest.manifest)
	const manifestHls = addMetadataToHls(manifest, mainManifestParsed)
	const selectionSets: SelectionSet[] = []
	const manifestPlaylists = manifestHls.ancillaryManifests
		? [...manifestHls.ancillaryManifests]
		: []

	const audioSwitchingSets = audioGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.AUDIO,
		manifestPlaylists,
	)
	const subtitleSwitchingSets = subtitleGroupsToSwitchingSets(
		mainManifestParsed.mediaGroups?.SUBTITLES,
		manifestPlaylists,
	)
	const videoSwitchingSets = videoPlaylistsToSwitchingSets(
		mainManifestParsed.playlists,
		manifestPlaylists,
	)

	let selectionSetId = 0

	if (audioSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: audioSwitchingSets,
			type: 'audio',
		} as SelectionSet)
	}

	if (subtitleSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: subtitleSwitchingSets,
			type: 'text',
		} as SelectionSet)
	}

	if (videoSwitchingSets.length > 0) {
		selectionSets.push({
			id: (selectionSetId++).toString(),
			switchingSets: videoSwitchingSets,
			type: 'video',
		} as SelectionSet)
	}

	// Calculate total duration from the longest track
	let duration = 0
	for (const selectionSet of selectionSets) {
		for (const switchingSet of selectionSet.switchingSets) {
			for (const track of switchingSet.tracks) {
				if (track.duration > duration) {
					duration = track.duration
				}
			}
		}
	}

	let presentationId = 0

	return [
		{
			id: (presentationId++).toString(),
			selectionSets: selectionSets,
			duration,
			startTime: 0,
			endTime: duration,
			baseUrls: [],
		},
	]
}
