import { writeWith } from '../util/writeWith.ts'
import {
	isIsoBoxType,
	assert,
	describe,
	it,
	writeIsoBox,
	readIsoBoxes,
	readPssh,
	writePssh,
	type ProtectionSystemSpecificHeaderBox,
} from '../util/box.ts'
import { KID_A, KID_B, psshBox, SYSTEM_ID } from '../util/psshBoxes.ts'
import { boxBytes } from '../util/wideBoxes.ts'

function pssh(version: number, kid: number[][]): ProtectionSystemSpecificHeaderBox {
	return {
		type: 'pssh',
		version,
		flags: 0,
		systemId: new Uint8Array(SYSTEM_ID),
		kid: kid.map(id => new Uint8Array(id)),
		data: new Uint8Array([1, 2, 3, 4]),
	}
}

describe('writePssh', function () {
	it('should write the 16 bytes of one key ID in a version 1 box', function () {
		// #region example
		const writer = writeIsoBox(
			{
				type: 'pssh',
				version: 1,
				flags: 0,
				systemId: new Uint8Array(16).fill(0xaa),
				kid: [new Uint8Array(16).fill(0x11)],
				data: new Uint8Array([1, 2, 3, 4]),
			},
			{ writers: { pssh: writePssh } },
		)

		// size (56), type (pssh), version and flags, SystemID, KID_count (1),
		// the 16 bytes of the KID, DataSize (4), then the Data
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 56, 112, 115, 115, 104, 1, 0, 0, 0, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
				0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0, 0, 0, 1, 0x11, 0x11, 0x11, 0x11, 0x11,
				0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0, 0, 0, 4, 1, 2, 3, 4,
			]),
		)
		// #endregion example
	})

	it('should write the 32 bytes of two key IDs in a version 1 box', function () {
		const writer = writeWith(writePssh, pssh(1, [KID_A, KID_B]))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
		)
	})

	it('should write a version 1 box with no key ID', function () {
		const writer = writeWith(writePssh, pssh(1, []))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4]),
		)
	})

	it('should write a version 0 box', function () {
		const writer = writeWith(writePssh, pssh(0, []))

		assert.deepStrictEqual(new Uint8Array(writer.buffer), psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4]))
	})

	for (const [name, input] of [
		['a version 1 box with one key ID', psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 4, 1, 2, 3, 4])],
		[
			'a version 1 box with two key IDs',
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
		],
		['a version 1 box with one key ID and no data', psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 0])],
		['a version 1 box with no key ID', psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4])],
		['a version 0 box', psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4])],
	] as const) {
		it(`should write the source bytes of ${name} that readPssh parsed`, function () {
			const [parsed] = readIsoBoxes(input, { readers: { pssh: readPssh } })

			assert.ok(isIsoBoxType('pssh', parsed))
			assert.deepStrictEqual(new Uint8Array(writeWith(writePssh, parsed).buffer), input)
		})
	}

	it('should write 16 bytes for a short or a long systemId and key ID', function () {
		const short = new Uint8Array(SYSTEM_ID.slice(0, 15))
		const long = new Uint8Array([...KID_A, 0xff])
		const writer = writeWith(writePssh, {
			type: 'pssh',
			version: 1,
			flags: 0,
			systemId: short,
			kid: [long],
			data: new Uint8Array(),
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			boxBytes(
				'pssh',
				[1, 1],
				[0, 3],
				new Uint8Array([...SYSTEM_ID.slice(0, 15), 0]),
				[1, 4],
				new Uint8Array(KID_A),
				[0, 4],
			),
		)
	})
})
