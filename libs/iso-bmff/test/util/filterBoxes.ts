import { readIsoBoxes, traverseIsoBoxes, type IsoBoxMap, type IsoBoxReadViewConfig, type IsoTypedParsedBox } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

export function filterBoxes<T extends keyof IsoBoxMap>(file: string, type: T, config?: IsoBoxReadViewConfig): IsoTypedParsedBox<T>[] {
	const boxes = readIsoBoxes(load(file), config)

	const found: IsoTypedParsedBox<T>[] = []

	for (const box of traverseIsoBoxes(boxes)) {
		if (box.type === type) {
			found.push(box as unknown as IsoTypedParsedBox<T>)
		}
	}

	return found
}
