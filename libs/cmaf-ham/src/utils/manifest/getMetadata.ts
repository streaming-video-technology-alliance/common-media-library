import type { ManifestFile } from '../../types/manifest/ManifestFile.ts'

export function getMetadata(manifest: ManifestFile | undefined): any | undefined {
	const metadata: Map<string, string> | undefined = manifest?.metadata
	return JSON.parse(JSON.stringify(metadata))
}
