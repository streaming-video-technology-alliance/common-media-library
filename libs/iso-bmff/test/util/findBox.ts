import { readIsoBoxes, type IsoBoxMap, type IsoBoxReaderMap, type IsoTypedParsedBox } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { crawlBoxes } from './crawlBoxes.ts'
import { load } from './load.ts'

export function findBox<T extends keyof IsoBoxMap>(file: string, type: T, readers: IsoBoxReaderMap): IsoTypedParsedBox<T> {
	const boxes = readIsoBoxes(load(file), { readers })
	let found: IsoTypedParsedBox<T> | undefined

	crawlBoxes(boxes, box => {
		if (box.type === type) {
			// TypeScript can't narrow ParsedBox to IsoTypedParsedBox<T> based on runtime type value,
			// but we know at runtime that box.type === type, so the box matches IsoTypedParsedBox<T>
			found = box as unknown as IsoTypedParsedBox<T>
			return true
		}

		return false
	})

	assert.ok(found)

	return found
}
