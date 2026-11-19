import {
	readIsoBoxes,
	traverseIsoBoxes,
	type IsoBoxMap,
	type IsoBoxReadConfig,
} from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { load } from './load.ts'

export function findBox<T extends keyof IsoBoxMap>(
	file: string,
	type: T,
	config?: IsoBoxReadConfig,
): IsoBoxMap[T] {
	const boxes = readIsoBoxes(load(file), config)

	for (const box of traverseIsoBoxes(boxes)) {
		if (box.type === type) {
			// TypeScript can't narrow ParsedBox to IsoBoxMap[T] based on runtime type value,
			// but we know at runtime that box.type === type, so the box matches IsoBoxMap[T]
			return box as unknown as IsoBoxMap[T]
		}
	}

	assert.fail(`Box of type ${type} not found in file ${file}`)
}
