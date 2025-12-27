import type { IsoBmffBoxMap, IsoBoxReader, IsoBoxReaderMap } from '@svta/cml-iso-bmff'
import { getReaderName } from './getReaderName.ts'

export function createReaders(readers: IsoBoxReader | IsoBoxReader[]): { name: keyof IsoBmffBoxMap, readers: IsoBoxReaderMap } {
	if (!Array.isArray(readers)) {
		readers = [readers]
	}

	return {
		name: getReaderName(readers[0]) as keyof IsoBmffBoxMap,
		readers: readers.reduce((acc, reader) => {
			acc[getReaderName(reader)] = reader
			return acc
		}, {} as IsoBoxReaderMap),
	}
}
