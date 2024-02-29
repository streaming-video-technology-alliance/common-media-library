import { mapHamToHls } from './hls/mapHamToHls.js';
import { mapHlsToHam } from './hls/mapHlsToHam.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { getMetadata } from '../../utils/manifestUtils.js';

export class HLSMapper implements IMapper {
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
