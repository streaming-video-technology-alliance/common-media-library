import { Presentation } from '../types/model/index.js';
import { Manifest } from '../../utils/types/Manifest.js';

export interface IMapper {
    toHam(manifest:Manifest) : Presentation[];
    toManifest(presentation : Presentation[]): Manifest
}
