import type { Box } from '@svta/common-media-library';
import { parseFile } from './parseFile';

export function parseContainer(file: string, index: number): Box<any> | null {
	return parseFile(file, { recursive: false }).at(index) || null;
}
