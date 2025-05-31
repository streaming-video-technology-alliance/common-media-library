import fs from 'node:fs';

export function load(file: string): ArrayBuffer {
	const filePath = new URL(`../fixtures/${file}`, import.meta.url);
	return new Uint8Array(fs.readFileSync(filePath)).buffer;
}
