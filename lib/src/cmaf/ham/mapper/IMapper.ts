import type { Presentation } from '../types/model/Presentation.js';
import type { Manifest } from '../types/manifest/Manifest.js';

export type IMapper = {
	toHam(manifest: Manifest): Presentation[];

	toManifest(presentation: Presentation[]): Manifest;

	getManifestMetadata(): any | undefined;
}
