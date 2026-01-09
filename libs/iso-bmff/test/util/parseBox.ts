import type { IsoBox, IsoBoxReader, ParsedBox } from '@svta/cml-iso-bmff'
import { getReaderName } from './getReaderName.ts'
import { parseFile } from './parseFile.ts'

export function parseBox<T extends IsoBox>(file: string, reader: IsoBoxReader<T>, index: number): ParsedBox<T> {
	return parseFile(file, { readers: { [getReaderName(reader)]: reader } })[index] as ParsedBox<T>
}
