type Manifest = {
    main : string, 
    playlists ? : string[],
    type : 'm3u8' | 'mpd',
};

export type { Manifest };
