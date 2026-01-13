import type { ManifestFile } from '../../types/manifest/ManifestFile.ts'
import type { Presentation } from '../../types/model/Presentation.ts'

import { mapHamToHls } from './mapHamToHls/mapHamToHls.ts'
import { mapHlsToHam } from './mapHlsToHam/mapHlsToHam.ts'

import { getMetadata } from '../../utils/manifest/getMetadata.ts'

import type { Mapper } from '../Mapper.ts'

export class HlsMapper implements Mapper {
	private manifest: ManifestFile | undefined

	getManifestMetadata(): any | undefined {
		return getMetadata(this.manifest)
	}

	toHam(manifest: ManifestFile): Presentation[] {
		const presentations: Presentation[] = mapHlsToHam(manifest)
		this.manifest = manifest
		return presentations
	}

	toManifest(presentation: Presentation[]): ManifestFile {
		return mapHamToHls(presentation)
	}
}
