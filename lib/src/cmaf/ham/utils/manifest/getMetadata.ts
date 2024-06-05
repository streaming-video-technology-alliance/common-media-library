import type { Manifest } from '../../types/manifest/Manifest.js';

export function getMetadata(manifest: Manifest | undefined): any | undefined {
	const metadata: Map<string, string> | undefined = manifest?.metadata;
	return JSON.parse(JSON.stringify(metadata));
}
