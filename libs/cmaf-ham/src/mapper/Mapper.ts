import type { ManifestFile } from '../types/manifest/ManifestFile.ts'
import type { Presentation } from '../types/model/Presentation.ts'

export type Mapper = {
	toHam(manifest: ManifestFile): Presentation[];

	toManifest(presentation: Presentation[]): ManifestFile;

	getManifestMetadata(): any | undefined;
};
