import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readSchm,
	writeSchm,
	type SchemeTypeBox,
} from '../util/box.ts'

function schm(flags: number, schemeUri?: string): SchemeTypeBox {
	return {
		type: 'schm',
		version: 0,
		flags,
		schemeType: 0x63656e63, // cenc
		schemeVersion: 0x00010000,
		schemeUri,
	}
}

describe('writeSchm', function () {
	it('should write the null terminator of an empty schemeUri when flag 0x000001 is set', function () {
		// #region example
		const writer = writeSchm({
			type: 'schm',
			version: 0,
			flags: 1,
			schemeType: 0x63656e63, // cenc
			schemeVersion: 0x00010000,
			schemeUri: '',
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0,
				0,
				0,
				21, // size (8 + 4 + 4 + 4 + 1 = 21)
				115,
				99,
				104,
				109, // type (schm)
				0, // version
				0,
				0,
				1, // flags
				99,
				101,
				110,
				99, // schemeType (cenc)
				0,
				1,
				0,
				0, // schemeVersion
				0, // schemeUri (empty) and the null terminator
			]),
		)
		// #endregion example
	})

	it('should write an empty schemeUri when flag 0x000001 is set and the box has no schemeUri', function () {
		const writer = writeSchm({
			type: 'schm',
			version: 0,
			flags: 1,
			schemeType: 0x63656e63,
			schemeVersion: 0x00010000,
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 21, 115, 99, 104, 109, 0, 0, 0, 1, 99, 101, 110, 99, 0, 1, 0, 0, 0]),
		)
	})

	it('should write the schemeUri and a null terminator when flag 0x000001 is set', function () {
		const writer = writeSchm(schm(1, 'urn:a'))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 26, 115, 99, 104, 109, 0, 0, 0, 1, 99, 101, 110, 99, 0, 1, 0, 0, 117, 114, 110, 58,
				97, 0,
			]),
		)
	})

	it('should not write the schemeUri when flag 0x000001 is not set', function () {
		const writer = writeSchm(schm(0, 'urn:a'))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 20, 115, 99, 104, 109, 0, 0, 0, 0, 99, 101, 110, 99, 0, 1, 0, 0]),
		)
	})

	it('should write no schemeUri when flag 0x000001 is not set and the box has no schemeUri', function () {
		const writer = writeSchm({
			type: 'schm',
			version: 0,
			flags: 0,
			schemeType: 0x63656e63,
			schemeVersion: 0x00010000,
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 20, 115, 99, 104, 109, 0, 0, 0, 0, 99, 101, 110, 99, 0, 1, 0, 0]),
		)
	})

	it('should write the bytes of a parsed box that has flag 0x000001 and an empty schemeUri', function () {
		const input = new Uint8Array([
			0, 0, 0, 21, 115, 99, 104, 109, 0, 0, 0, 1, 99, 101, 110, 99, 0, 1, 0, 0, 0,
		])

		const [parsed] = readIsoBoxes(input, { readers: { schm: readSchm } })

		assert.strictEqual(parsed.type, 'schm')
		assert.strictEqual(parsed.schemeUri, '')
		assert.deepStrictEqual(new Uint8Array(writeSchm(parsed).buffer), input)
	})

	for (const box of [schm(1, 'urn:a'), schm(1, ''), schm(0)]) {
		it(`should write a box that readSchm reads with flags ${box.flags} and the schemeUri ${JSON.stringify(box.schemeUri)}`, function () {
			const [parsed] = readIsoBoxes(new Uint8Array(writeSchm(box).buffer), {
				readers: { schm: readSchm },
			})

			assert.strictEqual(parsed.type, 'schm')

			const { type, version, flags, schemeType, schemeVersion, schemeUri } = parsed

			assert.deepStrictEqual({ type, version, flags, schemeType, schemeVersion, schemeUri }, box)
		})
	}
})
