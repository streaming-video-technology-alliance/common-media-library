import type { ManifestFile } from '../../types/manifest/ManifestFile.ts'
import type { DashManifest } from '../../types/mapper/dash/DashManifest.ts'
import type { Presentation } from '../../types/model/Presentation.ts'

import { mapDashToHam } from './mapDashToHam/mapDashToHam.ts'
import { mapHamToDash } from './mapHamToDash/mapHamToDash.ts'

import { parseDashManifest } from '../../utils/dash/parseDashManifest.ts'
import { addMetadataToDash } from '../../utils/manifest/addMetadataToDash.ts'
import { getMetadata } from '../../utils/manifest/getMetadata.ts'

import type { Mapper } from '../Mapper.ts'

export class DashMapper implements Mapper {
	private manifest: ManifestFile | undefined

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest)
	}

	toHam(manifest: ManifestFile): Presentation[] {
		const dashManifest: DashManifest | undefined = parseDashManifest(
			manifest.manifest,
		)

		if (!dashManifest) {
			return []
		}
		addMetadataToDash(dashManifest, manifest)

		return mapDashToHam(dashManifest)
	}

	toManifest(presentation: Presentation[]): ManifestFile {
		const manifest = mapHamToDash(presentation)
		return { manifest, ancillaryManifests: [], type: 'dash' }
	}
}
