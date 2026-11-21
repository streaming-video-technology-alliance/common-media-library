import { writeWith } from '../util/writeWith.ts'
import {
	isIsoBoxType,
	assert,
	describe,
	it,
	writeIsoBox,
	readHdlr,
	readIsoBoxes,
	writeHdlr,
	type HandlerBox,
} from '../util/box.ts'

// 'é日😀' has one character of two, three, and four UTF-8 bytes.
const TEXT = 'é日😀'
const TEXT_BYTES = [0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80]

// type (hdlr), version and flags, pre_defined, handler_type (vide), reserved
const FIELDS = [
	104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0,
]

function hdlr(name: string): HandlerBox {
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
		const writer = writeIsoBox(
			{
				type: 'hdlr',
				version: 0,
				flags: 0,
				preDefined: 0,
				handlerType: 'vide',
				reserved: [0, 0, 0],
				name: 'Video',
			},
			{ writers: { hdlr: writeHdlr } },
		)
		// #endregion example

		// size (38), type (hdlr), version and flags, pre_defined, handler_type (vide),
		// reserved, then the name (Video) and a null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 38, 104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 86, 105, 100, 101, 111, 0,
			]),
		)
	})

	it('should write the UTF-8 bytes of a name that is not ASCII', function () {
		const writer = writeWith(writeHdlr, hdlr(TEXT))

		// size: 32 + 9 name bytes + 1 null terminator = 42
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 42, ...FIELDS, ...TEXT_BYTES, 0]),
		)
	})

	it('should write the null terminator of an empty name', function () {
		const writer = writeWith(writeHdlr, hdlr(''))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 33, ...FIELDS, 0]),
		)
	})

	for (const text of ['Video', '', TEXT]) {
		it(`should write a box that readHdlr reads with the name '${text}'`, function () {
			const box = hdlr(text)
			const [parsed] = readIsoBoxes(new Uint8Array(writeWith(writeHdlr, box).buffer), {
				readers: { hdlr: readHdlr },
			})

			assert.ok(parsed)
			assert.ok(isIsoBoxType('hdlr', parsed))

			const { type, version, flags, preDefined, handlerType, reserved, name } = parsed

			assert.deepStrictEqual({ type, version, flags, preDefined, handlerType, reserved, name }, box)
		})
	}

	it('should end the name at the first U+0000', function () {
		const bytes = writeWith(writeHdlr, {
			type: 'hdlr',
			version: 0,
			flags: 0,
			handlerType: 'vide',
			name: 'a\0b',
		})
		const [box] = readIsoBoxes(bytes, { readers: { hdlr: readHdlr } })

		assert.deepStrictEqual(Array.from(bytes.subarray(32)), [0x61, 0])
		assert.ok(isIsoBoxType('hdlr', box))
		assert.strictEqual(box.name, 'a')
	})
})
