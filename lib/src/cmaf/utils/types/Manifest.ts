type Format = 'm3u8' | 'mpd';

type Manifest = {
	manifest: string;
	ancillaryManifests?: Manifest[];
	type: Format;
	metaData?: Map<string, string>;
};

export type { Manifest };
