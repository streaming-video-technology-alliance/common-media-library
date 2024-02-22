type Manifest = {
    main : string, 
    playlists ? : string[],
    type : 'm3u8' | 'mpd',
};

const hola : Manifest = {
	main: 'string',
	type: 'm3u8',
};

export type { Manifest };
