import type { ManifestFormat } from './ManifestFormat.ts';

/**
 * Manifest object received as an input by the conversion to HAM object
 *
 * @alpha
 */
export type Manifest = {
	manifest: string;
	fileName?: string;
	ancillaryManifests?: Manifest[];
	type: ManifestFormat;
	metadata?: Map<string, string>;
};
