import { assert, describe, findBox, it, readHdlr, readIsoBoxes } from '../util/box.ts'

describe('readHdlr', function () {
	it('should correctly parse the box', function () {
		const box = findBox('captions.mp4', 'hdlr', { readers: { hdlr: readHdlr } })

		assert.strictEqual(box.type, 'hdlr')
		assert.strictEqual(box.size, 68)

		assert.strictEqual(box.preDefined, 0)
		assert.strictEqual(box.handlerType, 'subt')
		assert.deepStrictEqual(box.reserved, [0, 0, 0])
		assert.strictEqual(box.name, '*xml:ext=ttml@GPAC0.5.1-DEV-rev5545')
	})

	it('should handle null-terminated strings that are not null-terminated and might exceed box boundaries', function () {
		const box = findBox('240fps_go_pro_hero_4.mp4', 'hdlr', { readers: { hdlr: readHdlr } })

		assert.ok(box)
		assert.strictEqual(box.name, '\tGoPro AVC')
	})

	it('should read a name with multi-byte UTF-8 characters', function () {
		// #region example
		// An hdlr box with the handler type 'vide' and the UTF-8 bytes of the name 'é日😀'.
		const bytes = new Uint8Array([
			0, 0, 0, 42, 104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80, 0,
		])
		const [hdlr] = readIsoBoxes(bytes, { readers: { hdlr: readHdlr } })
		// #endregion example

		assert.ok(hdlr)
		assert.strictEqual(hdlr.type, 'hdlr')
		assert.strictEqual(hdlr.preDefined, 0)
		assert.strictEqual(hdlr.handlerType, 'vide')
		assert.deepStrictEqual(hdlr.reserved, [0, 0, 0])
		assert.strictEqual(hdlr.name, 'é日😀')
	})

	it('should read an empty name', function () {
		const bytes = new Uint8Array([
			0, 0, 0, 33, 104, 100, 108, 114, 0, 0, 0, 0, 0, 0, 0, 0, 118, 105, 100, 101, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
		])
		const [hdlr] = readIsoBoxes(bytes, { readers: { hdlr: readHdlr } })

		assert.ok(hdlr)
		assert.strictEqual(hdlr.type, 'hdlr')
		assert.strictEqual(hdlr.handlerType, 'vide')
		assert.strictEqual(hdlr.name, '')
	})
})
