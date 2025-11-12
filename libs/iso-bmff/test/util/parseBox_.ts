import type { Box, IsoDataWriter, IsoView } from '@svta/cml-iso-bmff'
import { parseFile } from './parseFile.ts'

type BoxProcessor<T> = {
	type: string
	read: (view: IsoView) => T
	write: (box: T, view: IsoDataWriter) => void
}
export function parseBox_<T extends Box>(file: string, processor: BoxProcessor<T>, index: number): T {
	return parseFile(file, { parsers: { [processor.type]: processor.read } })[index] as T
}
