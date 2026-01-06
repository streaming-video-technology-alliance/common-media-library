import type { ManifestFormat } from './ManifestFormat.ts'

/**
 * Manifest object received as an input by the conversion to HAM object
 *
 * @alpha
 */
export type Manifest = {
	type: ManifestFormat;
	manifest: string;
	fileName?: string;
	ancillaryManifests?: Manifest[];
	metadata?: Map<string, string>;
};
