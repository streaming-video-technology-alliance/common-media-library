import type { Box, IsoBoxReader } from '@svta/cml-iso-bmff'
import { parseFile } from './parseFile.ts'

export function parseBox<T extends Box>(file: string, reader: IsoBoxReader<T>, index: number): T {
	return parseFile(file, { readers: { [reader.name]: reader } })[index] as T
}
