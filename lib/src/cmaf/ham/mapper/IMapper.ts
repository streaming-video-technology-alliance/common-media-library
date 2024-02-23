import { Presentation } from '../model/index.js';
import { Manifest } from '../../utils/types/Manifest.js';

export interface IMapper {
	toHam(manifest: Manifest): Presentation[];
	toManifest(presentation: Presentation[]): Manifest;
}
