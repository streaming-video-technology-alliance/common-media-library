import type { Manifest } from '../types/manifest/Manifest';
import type { Presentation } from '../types/model/Presentation';

export type Mapper = {
	toHam(manifest: Manifest): Presentation[];

	toManifest(presentation: Presentation[]): Manifest;

	getManifestMetadata(): any | undefined;
};
