import type { HlsManifest } from '../../types/mapper/hls/HlsManifest.ts'
import type { ManifestFile } from '../../types/manifest/ManifestFile.ts'

//Add metadata to manifest.
//In the future, if any other fields are wanted to be added, they can be added here.
export function addMetadataToHls(
	manifest: ManifestFile,
	manifestParsed: Pick<HlsManifest, 'version' | 'mediaSequence'>,
): ManifestFile {
	if (!manifest.metadata) {
		manifest.metadata = new Map<string, string>()
	}
	if (manifestParsed.version !== undefined) {
		manifest.metadata.set('version', String(manifestParsed.version))
	}
	if (manifestParsed.mediaSequence !== undefined) {
		manifest.metadata.set('mediaSequence', String(manifestParsed.mediaSequence))
	}
	return manifest
}
