import type { Box, BoxParser } from '@svta/cml-iso-bmff'
import { parseFile } from './parseFile.ts'

export function parseBox<T extends Box>(file: string, parser: BoxParser<T>, index: number): T {
	return parseFile(file, { parsers: { [parser.name]: parser } })[index] as T
}
