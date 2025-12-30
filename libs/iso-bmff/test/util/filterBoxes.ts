import { readIsoBoxes, traverseIsoBoxes, type IsoBoxMap, type IsoBoxReaderMap, type IsoParsedBox } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function filterBoxes<T extends keyof IsoBoxMap>(file: string, type: T, readers: IsoBoxReaderMap): IsoParsedBox<IsoBoxMap[T]>[] {
	const boxes = readIsoBoxes(load(file), { readers })

	const found: IsoParsedBox<IsoBoxMap[T]>[] = []

	for (const box of traverseIsoBoxes(boxes)) {
		if (box.type === type) {
			found.push(box as unknown as IsoParsedBox<IsoBoxMap[T]>)
		}
	}

	return found
}
