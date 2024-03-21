type Format = 'm3u8' | 'mpd';

/**
 * Manifest object received as an input by the conversion to HAM object
 *
 * @group CMAF
 *
 * @alpha
 */
type Manifest = {
	manifest: string;
	ancillaryManifests?: Manifest[];
	type: Format;
	metadata?: Map<string, string>;
};

export type { Manifest };
