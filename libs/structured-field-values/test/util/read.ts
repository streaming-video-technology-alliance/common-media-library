import { promises as fs } from 'node:fs'
import type { RawDict, RawItem, RawList } from './format.ts'

export type SfTestCase = {
	name: string
	raw: string[]
	header_type: 'item' | 'list' | 'dictionary'
	expected?: RawItem | RawList | RawDict
	must_fail?: boolean
	can_fail?: boolean
	canonical?: string[]
}

// read json test suite
export async function read(name: string): Promise<SfTestCase[]> {
	const json = await fs.readFile(
		new URL(`../../../../structured-field-tests/${name}.json`, import.meta.url),
		'utf8',
	)
	return JSON.parse(json) as SfTestCase[]
}
