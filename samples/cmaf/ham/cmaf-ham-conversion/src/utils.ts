import fs from 'fs';
import path from 'path';

/**
 * Returns the main and playlists paths of a HLS content from a folder.
 * Note: The main playlist (multivariant playlist) must be named "main.m3u8" or "manifest.m3u8"
 * @param directory - The directory to search for .m3u8 files.
 * @returns An object containing arrays of paths for main and other .m3u8 files.
 */
export function listM3U8Files(directory: string): {
	manifest: string;
	playlists: string[];
	error: boolean;
} {
	let manifest: string = null;
	const playlists: string[] = [];

	const files = fs.readdirSync(directory);

	files.forEach((file) => {
		if (path.extname(file) === '.m3u8') {
			if (file === 'manifest.m3u8' || file === 'main.m3u8') {
				manifest = path.join(directory, file);
			}
			else {
				playlists.push(path.join(directory, file));
			}
		}
	});

	return {
		manifest: manifest,
		playlists: playlists,
		error: manifest === null || playlists.length === 0,
	};
}

/**
 * Returns a list of all mpd files in a folder
 * @param directory - The directory to search for .mpd files.
 * @returns Array of .mpd path files.
 */
export function listMPDFiles(directory: string): string[] {
	const mpds: string[] = [];
	const files = fs.readdirSync(directory);
	files.forEach((file) => {
		if (path.extname(file) === '.mpd') {
			mpds.push(path.join(directory, file));
		}
	});
	return mpds;
}

/**
 * Returns a list of directories in a folder
 * @param directory - The directory to list.
 * @returns Array of stirngs.
 */
export function listDirectories(directoryPath: string): string[] {
	const filesAndDirectories = fs.readdirSync(directoryPath);
	const directories = filesAndDirectories.filter((item) =>
		fs.statSync(path.join(directoryPath, item)).isDirectory(),
	);
	return directories;
}
