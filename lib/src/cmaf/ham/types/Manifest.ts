type Format = 'm3u8' | 'mpd';

/**
 * Manifest object returned by the conversion to CMAF-HAM
 *
 * @group CMAF
 *
 * @beta
 */
type Manifest = {
	manifest: string;
	ancillaryManifests?: Manifest[];
	type: Format;
	metaData?: Map<string, string>;
};

export type { Manifest };
