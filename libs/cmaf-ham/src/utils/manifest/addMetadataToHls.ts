import type { ManifestFile } from '../../types/manifest/ManifestFile.ts'

//Add metadata to manifest.
//In the future, if any other fields are wanted to be added, they can be added here.
export function addMetadataToHls(
	manifest: ManifestFile,
	manifestParsed: any,
): ManifestFile {
	if (!manifest.metadata) {
		manifest.metadata = new Map<string, string>()
	}
	if (!manifestParsed.version) {
		manifest.metadata.set('version', manifestParsed.version)
	}
	if (!manifestParsed.mediaSequence) {
		manifest.metadata.set('mediaSequence', manifestParsed.mediaSequence)
	}
	return manifest
}
