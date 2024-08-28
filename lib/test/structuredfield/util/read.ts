import { promises as fs } from 'node:fs';

// read json test suite
export async function read(name: string) {
	const json = await fs.readFile(`../structured-field-tests/${name}.json`, 'utf8');
	return JSON.parse(json);
}
