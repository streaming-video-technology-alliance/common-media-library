import { promises as fs } from 'node:fs'

// read json test suite
export async function read<T = any>(name: string): Promise<T> {
	const json = await fs.readFile(`../../structured-field-tests/${name}.json`, 'utf8')
	return JSON.parse(json)
}
