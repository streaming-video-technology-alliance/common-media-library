import type { Box } from '@svta/common-media-library';
import { parseFile } from './parseFile';

export function parseContainer(file: string, index: number): Box<Box[]> | null {
	return parseFile(file, { recursive: false }).at(index) || null;
}
