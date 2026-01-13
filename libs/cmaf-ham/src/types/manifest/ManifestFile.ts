import type { ManifestFormat } from './ManifestFormat.ts'

/**
 * Manifest object received as an input by the conversion to HAM object
 *
 * @alpha
 */
export type ManifestFile = {
	type: ManifestFormat;
	manifest: string;
	fileName?: string;
	ancillaryManifests?: ManifestFile[];
	metadata?: Map<string, string>;
};
