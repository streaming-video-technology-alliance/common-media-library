import type { Manifest } from '../../types/manifest/Manifest.ts';
import type { Presentation } from '../../types/model/Presentation.ts';

import { mapHamToHls } from './mapHamToHls/mapHamToHls.ts';
import { mapHlsToHam } from './mapHlsToHam/mapHlsToHam.ts';

import { getMetadata } from '../../utils/manifest/getMetadata.ts';

import type { Mapper } from '../Mapper.ts';

export class HlsMapper implements Mapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): any | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		const presentations: Presentation[] = mapHlsToHam(manifest);
		this.manifest = manifest;
		return presentations;
	}

	toManifest(presentation: Presentation[]): Manifest {
		return mapHamToHls(presentation);
	}
}
