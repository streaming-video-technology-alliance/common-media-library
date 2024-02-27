type Format = 'm3u8' | 'mpd';

type Manifest = {
	manifest: string;
	anciallaryManifests?: Manifest[];
	type: Format;
	metaData?: Map<string, string>;
};

export type { Manifest };
