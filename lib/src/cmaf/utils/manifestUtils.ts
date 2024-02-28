import { DashManifest } from './dash/DashManifest.js';
import { Manifest } from './types/index.js';
export function getMetadata(manifest: Manifest | undefined): JSON | undefined {
	const metadata: Map<string, string> | undefined = manifest?.metaData;
	return JSON.parse(JSON.stringify(metadata));
}

//Add metadata to manifest.
// In the future, if any other fields are wanted to be added, they can be added here.
export function addMetadataToHLS(
	manifest: Manifest,
	manifestParsed: any,
): Manifest {
	if (manifest.metaData === undefined) {
		manifest.metaData = new Map<string, string>();
	}
	if (manifestParsed.version! == undefined) {
		manifest.metaData.set('version', manifestParsed.version);
	}
	if (manifestParsed.mediaSequence! == undefined) {
		manifest.metaData.set('mediaSequence', manifestParsed.mediaSequence);
	}
	return manifest;
}

export function addMetadataToDASH(
	dashManifest: DashManifest,
	manifest: Manifest,
): Manifest {
	if (manifest.metaData === undefined) {
		manifest.metaData = new Map<string, string>();
	}
	if (dashManifest?.$ && dashManifest.$.profiles !== undefined) {
		manifest.metaData.set('profiles', dashManifest.$.profiles);
	}
	if (dashManifest?.$ && dashManifest.$.type !== undefined) {
		manifest.metaData.set('type', dashManifest.$.type);
	}
	return manifest;
}
