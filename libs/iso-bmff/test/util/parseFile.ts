import { readIsoBoxes, type IsoBoxReadViewConfig, type ParsedIsoBox } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function parseFile(file: string, config: IsoBoxReadViewConfig = {}): ParsedIsoBox[] {
	return readIsoBoxes(load(file), config)
}
