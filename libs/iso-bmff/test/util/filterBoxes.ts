import { readIsoBoxes, type IsoBoxMap, type IsoBoxReaderMap, type IsoParsedBox, type IsoTypedParsedBox } from '@svta/cml-iso-bmff'
import { crawlBoxes } from './crawlBoxes.ts'
import { load } from './load.ts'

export function filterBoxes<T extends keyof IsoBoxMap>(file: string, type: T, readers: IsoBoxReaderMap): IsoParsedBox<IsoTypedParsedBox<T>>[] {
	const boxes = readIsoBoxes(load(file), { readers })

	const found: IsoParsedBox<IsoTypedParsedBox<T>>[] = []

	crawlBoxes(boxes, box => {
		if (box.type === type) {
			// TypeScript can't narrow ParsedBox to IsoTypedParsedBox<T> based on runtime type value,
			// but we know at runtime that box.type === type, so the box matches IsoTypedParsedBox<T>
			found.push(box as unknown as IsoTypedParsedBox<T>)
			return true
		}

		return false
	})

	return found
}
