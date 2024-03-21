import { mapHamToHls } from './hls/mapHamToHls.js';
import { mapHlsToHam } from './hls/mapHlsToHam.js';
import { getMetadata } from '../../utils/manifestUtils.js';
import { IMapper } from './IMapper.js';
import type { Manifest } from '../types/index.js';
import type { Presentation } from '../types/model/index.js';

export class HlsMapper implements IMapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
		return getMetadata(this.manifest);
	}

	toHam(manifest: Manifest): Presentation[] {
		const presentations = mapHlsToHam(manifest);
		this.manifest = manifest;
		return presentations;
	}

	toManifest(presentation: Presentation[]): Manifest {
		return mapHamToHls(presentation);
	}
}
