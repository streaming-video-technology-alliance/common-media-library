import { readIsoBoxes, traverseIsoBoxes, type IsoBoxMap, type IsoBoxReaderMap, type IsoTypedParsedBox } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { load } from './load.ts'

export function findBox<T extends keyof IsoBoxMap>(file: string, type: T, readers: IsoBoxReaderMap): IsoTypedParsedBox<T> {
	const boxes = readIsoBoxes(load(file), { readers })
	let found: IsoTypedParsedBox<T> | undefined

	for (const box of traverseIsoBoxes(boxes)) {
		if (box.type === type) {
			// TypeScript can't narrow ParsedBox to IsoTypedParsedBox<T> based on runtime type value,
			// but we know at runtime that box.type === type, so the box matches IsoTypedParsedBox<T>
			return box as unknown as IsoTypedParsedBox<T>
		}
	}

	assert.ok(found, `Box of type ${type} not found in file ${file}`)

	return found
}
