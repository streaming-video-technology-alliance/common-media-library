import type { Manifest } from '../../types/manifest/Manifest.js';
import type { Presentation } from '../../types/model/Presentation.js';

import { mapHamToHls } from './mapHamToHls/mapHamToHls.js';
import { mapHlsToHam } from './mapHlsToHam/mapHlsToHam.js';

import { getMetadata } from '../../utils/manifest/getMetadata.js';

import { IMapper } from '../IMapper.js';

export class HlsMapper implements IMapper {
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
