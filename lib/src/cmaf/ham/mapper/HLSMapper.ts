import { hamToM3U8 } from '../../utils/hls/hamToHLS.js';
import { m3u8ToHam } from '../../utils/hls/HLSToHam.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';

export class HLSMapper implements IMapper {
	toHam(manifest: Manifest): Presentation[] {
		const presentations = m3u8ToHam(manifest);
		return presentations;
	}

	toManifest(presentation: Presentation[]): Manifest {
		const manifest = hamToM3U8(presentation);
		return manifest;
	}
}
