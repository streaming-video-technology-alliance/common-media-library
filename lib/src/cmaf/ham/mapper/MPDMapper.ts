import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../model/index.js';
import { IMapper } from './IMapper.js';

export class MPDMapper implements IMapper {
	toHam(manifest : Manifest) : Presentation[] {
		console.log (manifest);
		throw new Error('Not implemented');
	}
	toManifest(presentation : Presentation []) : Manifest{
		console.log(presentation);
		throw new Error('Not implemented');
	}
}
