type Format = 'm3u8' | 'mpd';

type Manifest = {
	manifest: string;
	anciallaryManifests?: Manifest[];
	type: Format;
};

export type { Manifest };
