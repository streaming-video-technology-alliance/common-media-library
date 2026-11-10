import { assert, describe, it, IsoBoxReadView, IsoBoxWriteView } from './util/box.ts'

function readTemplate(bytes: number[], size: number): number {
	return new IsoBoxReadView(new Uint8Array(bytes)).readTemplate(size)
}

function writeTemplate(value: number, size: number): Uint8Array {
	const writer = new IsoBoxWriteView('test', 8 + size)
	writer.writeTemplate(value, size)
	return new Uint8Array(writer.buffer).subarray(8)
}

describe('IsoBoxReadView.readTemplate', function () {
	it('should read a whole 16.16 value', function () {
		assert.strictEqual(readTemplate([0x00, 0x01, 0x00, 0x00], 4), 1)
	})

	it('should read the fraction of a 16.16 value', function () {
		assert.strictEqual(readTemplate([0x00, 0x01, 0x80, 0x00], 4), 1.5)
	})

	it('should read a whole 8.8 value', function () {
		assert.strictEqual(readTemplate([0x01, 0x00], 2), 1)
	})

	it('should read the fraction of an 8.8 value', function () {
		assert.strictEqual(readTemplate([0x01, 0x80], 2), 1.5)
	})

	it('should advance the cursor by the size of the value', function () {
		const view = new IsoBoxReadView(new Uint8Array([0x00, 0x01, 0x80, 0x00, 0x01, 0x80]))

		view.readTemplate(4)
		assert.strictEqual(view.cursor, 4)

		view.readTemplate(2)
		assert.strictEqual(view.cursor, 6)
	})

	it('should read back a 16.16 value that writeTemplate wrote', function () {
		for (const value of [1, 1.5]) {
			const bytes = writeTemplate(value, 4)

			assert.strictEqual(new IsoBoxReadView(bytes).readTemplate(4), value)
		}
	})

	it('should read back an 8.8 value that writeTemplate wrote', function () {
		for (const value of [1, 1.5]) {
			const bytes = writeTemplate(value, 2)

			assert.strictEqual(new IsoBoxReadView(bytes).readTemplate(2), value)
		}
	})
})
