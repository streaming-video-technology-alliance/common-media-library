import { assert, describe, it, readFtyp, readIsoBoxes, writeFtyp } from '../util/box.ts'

describe('writeFtyp', function () {
	it('should write a FileTypeBox correctly', function () {
		// #region example
		const box = {
			type: 'ftyp' as const,
			majorBrand: 'isom',
			minorVersion: 1,
			compatibleBrands: ['isom']
		}

		const writer = writeFtyp(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0x00, 0x00, 0x00, 0x14, // size
			0x66, 0x74, 0x79, 0x70, // type
			0x69, 0x73, 0x6f, 0x6d, // majorBrand
			0x00, 0x00, 0x00, 0x01, // minorVersion
			0x69, 0x73, 0x6f, 0x6d, // compatibleBrand[0]
		])), 0)
		// #endregion example
	})

	it('should write FileTypeBox with multiple compatible brands', function () {
		const box = {
			type: 'ftyp' as const,
			majorBrand: 'mp41',
			minorVersion: 0,
			compatibleBrands: ['mp41', 'iso2', 'dash']
		}

		const writer = writeFtyp(box)
		const buffer = new Uint8Array(writer.buffer)
		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0x00, 0x00, 0x00, 0x1c, // size
			0x66, 0x74, 0x79, 0x70, // type
			0x6d, 0x70, 0x34, 0x31, // majorBrand
			0x00, 0x00, 0x00, 0x00, // minorVersion
			0x6d, 0x70, 0x34, 0x31, // compatibleBrand[0]
			0x69, 0x73, 0x6f, 0x32, // compatibleBrand[1]
			0x64, 0x61, 0x73, 0x68, // compatibleBrand[2]
		])), 0)
	})

	it('should write FileTypeBox that can be read back correctly', function () {
		const box = {
			type: 'ftyp' as const,
			majorBrand: 'isom',
			minorVersion: 1,
			compatibleBrands: ['isom', 'iso2']
		}

		const writer = writeFtyp(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { ftyp: readFtyp } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'ftyp')
		assert.strictEqual(boxes[0].majorBrand, 'isom')
		assert.strictEqual(boxes[0].minorVersion, 1)
		assert.deepStrictEqual(boxes[0].compatibleBrands, ['isom', 'iso2'])
	})

	it('should write FileTypeBox with empty compatible brands', function () {
		const box = {
			type: 'ftyp' as const,
			majorBrand: 'test',
			minorVersion: 0,
			compatibleBrands: []
		}

		const writer = writeFtyp(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0x00, 0x00, 0x00, 0x10, // size
			0x66, 0x74, 0x79, 0x70, // type
			0x74, 0x65, 0x73, 0x74, // majorBrand
			0x00, 0x00, 0x00, 0x00, // minorVersion
		])), 0)
	})
})

