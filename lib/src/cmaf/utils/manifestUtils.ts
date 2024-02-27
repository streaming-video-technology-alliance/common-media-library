import { Manifest } from './types/index.js';

export function getMetadata(manifest: Manifest | undefined): JSON | undefined{
	const metadata: Map<string, string> | undefined = manifest?.metaData;
	return JSON.parse(JSON.stringify(metadata));
}
