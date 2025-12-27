import { readIsoBoxes, type Box, type IsoBoxReadViewConfig } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function parseFile(file: string, config: IsoBoxReadViewConfig): Box[] {
	return readIsoBoxes(load(file), config)
}
