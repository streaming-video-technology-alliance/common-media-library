import { findIsoBoxByType, type Box, type IsoBoxReader } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { createReaders } from './createReaders.ts'
import { load } from './load.ts'

export function findBox<T = Box>(file: string, boxReaders: IsoBoxReader<T> | IsoBoxReader<T>[]): T {
	const { name, readers } = createReaders(boxReaders)
	const box = findIsoBoxByType(load(file), name, { readers, recursive: true })

	assert.ok(box)

	return box as T
}
