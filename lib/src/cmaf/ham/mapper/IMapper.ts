import type { Presentation } from '../types/model';
import type { Manifest } from '../../utils/types';

export interface IMapper {
	toHam(manifest: Manifest): Presentation[];

	toManifest(presentation: Presentation[]): Manifest;

	getManifestMetadata(): JSON | undefined;
}
