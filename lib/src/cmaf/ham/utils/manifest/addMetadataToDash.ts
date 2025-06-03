import type { Manifest } from '../../types/manifest/Manifest.js';
import type { DashManifest } from '../../types/mapper/dash/DashManifest.js';

//Add metadata to manifest.
//In the future, if any other fields are wanted to be added, they can be added here.
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
