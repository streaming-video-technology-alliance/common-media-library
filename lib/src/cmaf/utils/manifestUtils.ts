import type { DashManifest, Manifest } from '../ham/types';

export function getMetadata(manifest: Manifest | undefined): JSON | undefined {
	const metadata: Map<string, string> | undefined = manifest?.metadata;
	return JSON.parse(JSON.stringify(metadata));
}

//Add metadata to manifest.
// In the future, if any other fields are wanted to be added, they can be added here.
export function addMetadataToHls(
	manifest: Manifest,
	manifestParsed: any,
): Manifest {
	if (!manifest.metadata) {
		manifest.metadata = new Map<string, string>();
	}
	if (!manifestParsed.version) {
		manifest.metadata.set('version', manifestParsed.version);
	}
	if (!manifestParsed.mediaSequence) {
		manifest.metadata.set('mediaSequence', manifestParsed.mediaSequence);
	}
	return manifest;
}

export function addMetadataToDash(
	dashManifest: DashManifest,
	manifest: Manifest,
): Manifest {
	if (!manifest.metadata) {
		manifest.metadata = new Map<string, string>();
	}
	if (dashManifest.MPD.$ && dashManifest.MPD.$.profiles) {
		manifest.metadata.set('profiles', dashManifest.MPD.$.profiles);
	}
	if (dashManifest.MPD.$ && dashManifest.MPD.$.type) {
		manifest.metadata.set('type', dashManifest.MPD.$.type);
	}
	return manifest;
}
