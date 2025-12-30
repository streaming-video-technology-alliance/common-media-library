import type { IsoBox, IsoBoxReader, IsoParsedBox } from '@svta/cml-iso-bmff'
import { getReaderName } from './getReaderName.ts'
import { parseFile } from './parseFile.ts'

export function parseBox<T extends IsoBox>(file: string, reader: IsoBoxReader<T>, index: number): IsoParsedBox<T> {
	return parseFile(file, { readers: { [getReaderName(reader)]: reader } })[index] as IsoParsedBox<T>
}
