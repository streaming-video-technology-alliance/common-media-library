import {
	isIsoBoxType,
	readIsoBoxes,
	readTfdt,
	readUint32,
	traverseIsoBoxes,
	type IsoBoxReadCursor,
	type IsoInt64,
} from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vite-plus/test'

describe('isIsoBoxType', function () {
	it('should narrow a box to the type of its four-character code', async function () {
		// #region example
		const isoFile = await readFile(new URL('./fixtures/mss_moof_tfdt.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, { readers: { tfdt: readTfdt } })

		const times: number[] = []
		for (const box of traverseIsoBoxes(boxes)) {
			if (isIsoBoxType('tfdt', box)) {
				times.push(box.baseMediaDecodeTime)
			}
		}
		// #endregion example

		assert.deepStrictEqual(times, [1289430514831666])
	})

	it('should narrow a child box to the type argument', function () {
		// #region typeArgument
		const readAbcd = (cursor: IsoBoxReadCursor<IsoInt64>) => ({
			type: 'abcd' as const,
			count: readUint32(cursor),
		})
		type AbcdBox = ReturnType<typeof readAbcd>

		// A moov box with one abcd child box
		const data = new Uint8Array([
			0x00, 0x00, 0x00, 0x14, 0x6d, 0x6f, 0x6f, 0x76, 0x00, 0x00, 0x00, 0x0c, 0x61, 0x62, 0x63,
			0x64, 0x00, 0x00, 0x00, 0x07,
		])
		const [moov] = readIsoBoxes(data, { readers: { abcd: readAbcd } })

		let count = 0
		if (isIsoBoxType('moov', moov)) {
			const child = moov.boxes[0]

			if (isIsoBoxType<AbcdBox>('abcd', child)) {
				count = child.count
			}
		}
		// #endregion typeArgument

		assert.strictEqual(count, 7)
	})

	it('should return false for a raw box with the type of the type argument', function () {
		type AbcdBox = { type: 'abcd'; count: number }
		const data = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x61, 0x62, 0x63, 0x64, 0x00, 0x00, 0x00, 0x07,
		])
		const [box] = readIsoBoxes(data)

		assert.strictEqual(box?.type, 'abcd')
		assert.strictEqual(isIsoBoxType<AbcdBox>('abcd', box), false)
	})

	it('should return false for another type', function () {
		assert.strictEqual(
			isIsoBoxType('tfdt', { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }),
			false,
		)
	})
})
