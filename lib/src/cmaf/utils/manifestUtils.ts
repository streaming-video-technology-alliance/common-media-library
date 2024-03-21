import type { DashManifest, Manifest } from '../ham/types';

export function getMetadata(manifest: Manifest | undefined): JSON | undefined {
	const metadata: Map<string, string> | undefined = manifest?.metadata;
	return JSON.parse(JSON.stringify(metadata));
}

//Add metadata to manifest.
// In the future, if any other fields are wanted to be added, they can be added here.
export function addMetadataToHLS(
	manifest: Manifest,
	manifestParsed: any,
): Manifest {
	if (manifest.metadata === undefined) {
		manifest.metadata = new Map<string, string>();
	}
	if (manifestParsed.version! == undefined) {
		manifest.metadata.set('version', manifestParsed.version);
	}
	if (manifestParsed.mediaSequence! == undefined) {
		manifest.metadata.set('mediaSequence', manifestParsed.mediaSequence);
	}
	return manifest;
}

export function addMetadataToDASH(
	dashManifest: DashManifest,
	manifest: Manifest,
): Manifest {
	if (manifest.metadata === undefined) {
		manifest.metadata = new Map<string, string>();
	}
	if (dashManifest.MPD.$ && dashManifest.MPD.$.profiles !== undefined) {
		manifest.metadata.set('profiles', dashManifest.MPD.$.profiles);
	}
	if (dashManifest.MPD.$ && dashManifest.MPD.$.type !== undefined) {
		manifest.metadata.set('type', dashManifest.MPD.$.type);
	}
	return manifest;
}
