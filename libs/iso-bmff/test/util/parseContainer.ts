import type { Box } from '@svta/cml-iso-bmff';
import { parseFile } from './parseFile.ts';

export function parseContainer(file: string, index: number): Box | null {
	return parseFile(file, { recursive: false }).at(index) || null;
}
