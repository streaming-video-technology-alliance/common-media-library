import { readIsoBoxes, type IsoBoxReadConfig, type ParsedIsoBox } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function parseFile(file: string, config: IsoBoxReadConfig = {}): ParsedIsoBox[] {
	return readIsoBoxes(load(file), config)
}
