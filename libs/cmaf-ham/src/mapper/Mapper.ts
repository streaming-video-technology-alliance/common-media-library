import type { Manifest } from '../types/manifest/Manifest.ts'
import type { Presentation } from '../types/model/Presentation.ts'

export type Mapper = {
	toHam(manifest: Manifest): Presentation[];

	toManifest(presentation: Presentation[]): Manifest;

	getManifestMetadata(): any | undefined;
};
