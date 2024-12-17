import type { Box } from '@svta/common-media-library';
import { parseFile } from './parseFile';

export function parseContainer(file: string, index: number): Box<Box[]> {
	return parseFile(file, { recursive: true })[index];
}
