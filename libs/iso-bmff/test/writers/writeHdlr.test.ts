import {
	assert,
	describe,
	it,
	readHdlr,
	readIsoBoxes,
	writeHdlr,
	type HandlerReferenceBox,
} from '../util/box.ts'

// 'é日😀' has one character of two, three, and four UTF-8 bytes.
const TEXT = 'é日😀'
const TEXT_BYTES = [0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80]

// type (hdlr), version and flags, pre_defined, handler_type (vide), reserved
const FIELDS = [
	104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0,
]

function hdlr(name: string): HandlerReferenceBox {
	return {
		type: 'hdlr',
		version: 0,
		flags: 0,
		preDefined: 0,
		handlerType: 'vide',
		reserved: [0, 0, 0],
		name,
	}
}

describe('writeHdlr', function () {
	it('should write the name and a null terminator', function () {
		// #region example
		const writer = writeHdlr({
			type: 'hdlr',
			version: 0,
			flags: 0,
			preDefined: 0,
			handlerType: 'vide',
			reserved: [0, 0, 0],
			name: 'Video',
		})

		// size (38), type (hdlr), version and flags, pre_defined, handler_type (vide),
		// reserved, then the name (Video) and a null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 38, 104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 86, 105, 100, 101, 111, 0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a name that is not ASCII', function () {
		const writer = writeHdlr(hdlr(TEXT))

		// size: 32 + 9 name bytes + 1 null terminator = 42
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 42, ...FIELDS, ...TEXT_BYTES, 0]),
		)
	})

	it('should write the null terminator of an empty name', function () {
		const writer = writeHdlr(hdlr(''))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 33, ...FIELDS, 0]),
		)
	})

	for (const text of ['Video', '', TEXT]) {
		it(`should write a box that readHdlr reads with the name '${text}'`, function () {
			const box = hdlr(text)
			const [parsed] = readIsoBoxes(new Uint8Array(writeHdlr(box).buffer), {
				readers: { hdlr: readHdlr },
			})

			assert.ok(parsed)
			assert.strictEqual(parsed.type, 'hdlr')

			const { type, version, flags, preDefined, handlerType, reserved, name } = parsed

			assert.deepStrictEqual({ type, version, flags, preDefined, handlerType, reserved, name }, box)
		})
	}
})
