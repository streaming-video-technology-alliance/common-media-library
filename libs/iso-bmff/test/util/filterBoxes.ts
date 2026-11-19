import {
	readIsoBoxes,
	traverseIsoBoxes,
	type IsoBoxMap,
	type IsoBoxReadConfig,
} from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function filterBoxes<T extends keyof IsoBoxMap>(
	file: string,
	type: T,
	config?: IsoBoxReadConfig,
): IsoBoxMap[T][] {
	const boxes = readIsoBoxes(load(file), config)

	const found: IsoBoxMap[T][] = []

	for (const box of traverseIsoBoxes(boxes)) {
		if (box.type === type) {
			found.push(box as unknown as IsoBoxMap[T])
		}
	}

	return found
}
