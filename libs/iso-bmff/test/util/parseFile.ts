import { readIsoBoxes, type IsoBoxReadViewConfig, type ParsedBox } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function parseFile(file: string, config: IsoBoxReadViewConfig = {}): ParsedBox[] {
	return readIsoBoxes(load(file), config)
}
