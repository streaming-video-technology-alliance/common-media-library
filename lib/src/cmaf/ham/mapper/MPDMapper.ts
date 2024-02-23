import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../model/index.js';
import { IMapper } from './IMapper.js';

export class MPDMapper implements IMapper {
	toHam(manifest : Manifest) : Presentation[] {
		throw new Error('Not implemented');
	}
	toManifest(presentation : Presentation []) : Manifest{
		throw new Error('Not implemented');
	}
}
