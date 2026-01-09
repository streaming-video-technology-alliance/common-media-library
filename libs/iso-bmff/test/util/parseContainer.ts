import type { ParsedIsoBox } from '@svta/cml-iso-bmff'
import { parseFile } from './parseFile.ts'

export function parseContainer(file: string, index: number): ParsedIsoBox | null {
	return parseFile(file).at(index) || null
}
