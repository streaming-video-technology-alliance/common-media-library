import { parseBoxes, type Box, type IsoViewConfig } from '@svta/common-media-library';
import { load } from './load.ts';

export function parseFile(file: string, config: IsoViewConfig): Box[] {
	return parseBoxes(load(file), config);
}
