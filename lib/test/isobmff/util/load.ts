import fs from 'node:fs';

export function load(file: string): ArrayBuffer {
	return new Uint8Array(fs.readFileSync(`./test/isobmff/fixtures/${file}`)).buffer;
}
