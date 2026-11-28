import {
	isIsoBoxType,
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
		if (isIsoBoxType(type, box)) {
			return box
		}
	}

	assert.fail(`Box of type ${type} not found in file ${file}`)
}
