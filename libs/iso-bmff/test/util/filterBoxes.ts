import { filterIsoBoxesByType, type Box, type IsoBoxReader } from '@svta/cml-iso-bmff'
import { createReaders } from './createReaders.ts'
import { load } from './load.ts'

export function filterBoxes<T extends Box = Box>(file: string, boxReaders: IsoBoxReader<T> | IsoBoxReader<T>[]): T[] {
	const { name, readers } = createReaders(boxReaders)
	return filterIsoBoxesByType(load(file), name, { readers }) as T[]
}
