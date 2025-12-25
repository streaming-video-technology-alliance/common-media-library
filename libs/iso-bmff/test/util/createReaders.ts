import type { IsoBmffBoxMap, IsoBoxReader, IsoBoxReaderMap } from '@svta/cml-iso-bmff'

export function createReaders(readers: IsoBoxReader | IsoBoxReader[]): { name: keyof IsoBmffBoxMap, readers: IsoBoxReaderMap } {
	if (!Array.isArray(readers)) {
		readers = [readers]
	}

	return {
		name: readers[0].name as keyof IsoBmffBoxMap,
		readers: readers.reduce((acc, reader) => {
			acc[reader.name] = reader
			return acc
		}, {} as IsoBoxReaderMap),
	}
}
