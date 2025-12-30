import type { ParsedBox } from '@svta/cml-iso-bmff'
import { parseFile } from './parseFile.ts'

export function parseContainer(file: string, index: number): ParsedBox | null {
	return parseFile(file).at(index) || null
}
