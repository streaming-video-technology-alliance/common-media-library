import type { Manifest } from '../types';
import type { Presentation } from '../types/model';
import { IMapper } from './IMapper.js';
import { mapHamToHls } from './hls/mapHamToHls.js';
import { mapHlsToHam } from './hls/mapHlsToHam.js';
import { getMetadata } from '../../utils/manifestUtils.js';

export class HlsMapper implements IMapper {
	private manifest: Manifest | undefined;

	getManifestMetadata(): JSON | undefined {
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
