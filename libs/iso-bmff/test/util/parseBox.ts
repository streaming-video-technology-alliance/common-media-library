import type { Box, IsoBoxReader } from '@svta/cml-iso-bmff'
import { getReaderName } from './getReaderName.ts'
import { parseFile } from './parseFile.ts'

export function parseBox<T extends Box>(file: string, reader: IsoBoxReader<T>, index: number): T {
	return parseFile(file, { readers: { [getReaderName(reader)]: reader } })[index] as T
}
