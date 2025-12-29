import type { IsoBox, IsoBoxMap, IsoBoxReader } from '@svta/cml-iso-bmff'

export function getReaderName(reader: IsoBoxReader<IsoBox>): keyof IsoBoxMap {
	return reader.name.toLowerCase().replace('read', '') as keyof IsoBoxMap
}
