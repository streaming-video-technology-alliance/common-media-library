import { assert, describe, findBox, it, readEmsg, readIsoBoxes } from '../util/box.ts'

const SCHEME = [0x75, 0x72, 0x6e, 0x3a, 0xc3, 0xa9] // 'urn:é'
const VALUE = [0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac] // '日本'

describe('readEmsg', function () {
	it('should read UTF-8 strings in a version 0 box', function () {
		const bytes = new Uint8Array([
			0x00,
			0x00,
			0x00,
			0x2b, // size
			0x65,
			0x6d,
			0x73,
			0x67, // type
			0x00,
			0x00,
			0x00,
			0x00, // version + flags
			...SCHEME,
			0x00, // schemeIdUri + terminator
			...VALUE,
			0x00, // value + terminator
			0x00,
			0x00,
			0x03,
			0xe8, // timescale
			0x00,
			0x00,
			0x00,
			0x05, // presentationTimeDelta
			0x00,
			0x00,
			0x00,
			0x0a, // eventDuration
			0x00,
			0x00,
			0x00,
			0x07, // id
			0xff, // messageData
		])

		const [box] = readIsoBoxes(bytes, { readers: { emsg: readEmsg } })

		assert.strictEqual(box.type, 'emsg')
		assert.strictEqual(box.version, 0)
		assert.strictEqual(box.schemeIdUri, 'urn:é')
		assert.strictEqual(box.value, '日本')
		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.presentationTimeDelta, 5)
		assert.strictEqual(box.eventDuration, 10)
		assert.strictEqual(box.id, 7)
		assert.deepStrictEqual(new Uint8Array(box.messageData), new Uint8Array([0xff]))
	})

	it('should read UTF-8 strings in a version 1 box', function () {
		const bytes = new Uint8Array([
			0x00,
			0x00,
			0x00,
			0x2f, // size
			0x65,
			0x6d,
			0x73,
			0x67, // type
			0x01,
			0x00,
			0x00,
			0x00, // version + flags
			0x00,
			0x00,
			0x03,
			0xe8, // timescale
			0x00,
			0x00,
			0x00,
			0x00, // presentationTime (hi)
			0x00,
			0x00,
			0x00,
			0x05, // presentationTime (lo)
			0x00,
			0x00,
			0x00,
			0x0a, // eventDuration
			0x00,
			0x00,
			0x00,
			0x07, // id
			...SCHEME,
			0x00, // schemeIdUri + terminator
			...VALUE,
			0x00, // value + terminator
			0xff, // messageData
		])

		const [box] = readIsoBoxes(bytes, { readers: { emsg: readEmsg } })

		assert.strictEqual(box.type, 'emsg')
		assert.strictEqual(box.version, 1)
		assert.strictEqual(box.schemeIdUri, 'urn:é')
		assert.strictEqual(box.value, '日本')
		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.presentationTime, 5)
		assert.strictEqual(box.eventDuration, 10)
		assert.strictEqual(box.id, 7)
		assert.deepStrictEqual(new Uint8Array(box.messageData), new Uint8Array([0xff]))
	})

	it('should correctly parse a version 0 box from sample data', function () {
		const box = findBox('emsg.m4s', 'emsg', { readers: { emsg: readEmsg } })

		assert.strictEqual(box.type, 'emsg')
		assert.strictEqual(box.size, 74)
		assert.strictEqual(box.version, 0)
		assert.strictEqual(box.schemeIdUri, 'urn:mpeg:dash:event:2012')
		assert.strictEqual(box.value, '1')
		assert.strictEqual(box.eventDuration, 65535)
		assert.strictEqual(box.id, 1)
		assert.strictEqual(box.timescale, 1)
		assert.strictEqual(box.presentationTimeDelta, 1)
		assert.deepStrictEqual(
			box.messageData,
			new Uint8Array([50, 48, 49, 52, 45, 48, 54, 45, 49, 49, 84, 49, 51, 58, 48, 54, 58, 50, 52]),
		)
	})

	it('should expose version-specific fields via discriminated union', function () {
		const box = findBox('emsg.m4s', 'emsg', { readers: { emsg: readEmsg } })

		// #region example
		assert.strictEqual(box.schemeIdUri, 'urn:mpeg:dash:event:2012')

		if (box.version === 0) {
			assert.strictEqual(typeof box.presentationTimeDelta, 'number')
		} else {
			assert.strictEqual(typeof box.presentationTime, 'number')
		}
		// #endregion example

		assert.strictEqual(box.version, 0)
	})

	it('should read a version 2 box as empty fields and messageData', function () {
		const fields = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 3, 0x61, 0, 0x62, 0, 1]
		const bytes = new Uint8Array([
			0,
			0,
			0,
			12 + fields.length,
			0x65,
			0x6d,
			0x73,
			0x67,
			2,
			0,
			0,
			1,
			...fields,
		])

		const [box] = readIsoBoxes(bytes, { readers: { emsg: readEmsg } })

		assert.strictEqual(box.type, 'emsg')
		assert.strictEqual(box.version, 2)
		assert.strictEqual(box.flags, 1)
		assert.strictEqual(box.schemeIdUri, '')
		assert.strictEqual(box.value, '')
		assert.strictEqual(box.timescale, 0)
		assert.strictEqual(box.presentationTimeDelta, 0)
		assert.strictEqual(box.presentationTime, 0)
		assert.strictEqual(box.eventDuration, 0)
		assert.strictEqual(box.id, 0)
		assert.deepStrictEqual(new Uint8Array(box.messageData), new Uint8Array(fields))
	})
})
