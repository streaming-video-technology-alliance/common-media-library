import { parsePsshList } from '@svta/cml-drm'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { samplePsshBox } from '../common/samplePsshBox.ts'

describe('parsePsshList', () => {
	it('should return an object with the correct UUID and PSSH box', () => {
		//#region example
		const initData = new Uint8Array(samplePsshBox).buffer
		const result = parsePsshList(initData)
		//#endregion example
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1) // should have one key
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		strictEqual(psshBox.byteLength, samplePsshBox.length) // length should match
		deepStrictEqual(new Uint8Array(psshBox), samplePsshBox) // actual data should match
	})

	it('should parse PSSH boxes from a Uint8Array', () => {
		const initData = new Uint8Array(samplePsshBox)
		const result = parsePsshList(initData)
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1)
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		ok(psshBox instanceof Uint8Array, 'result value should be a Uint8Array')
		strictEqual(psshBox.byteLength, samplePsshBox.length)
		deepStrictEqual(psshBox, samplePsshBox)
	})

	it('should parse PSSH boxes from a Uint8Array subarray with non-zero byteOffset', () => {
		// Create a larger buffer with padding before the PSSH box
		const padding = new Uint8Array(100).fill(0xff)
		const combined = new Uint8Array(padding.length + samplePsshBox.length)
		combined.set(padding, 0)
		combined.set(samplePsshBox, padding.length)

		// Create a subarray that starts at the PSSH box (non-zero byteOffset)
		const initData = combined.subarray(padding.length)
		const result = parsePsshList(initData)
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1)
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		ok(psshBox instanceof Uint8Array, 'result value should be a Uint8Array')
		strictEqual(psshBox.byteLength, samplePsshBox.length)
		deepStrictEqual(psshBox, samplePsshBox)
	})

	describe('box sizes', () => {
		const PSSH = [0x70, 0x73, 0x73, 0x68]
		const FREE = [0x66, 0x72, 0x65, 0x65]
		const SYSTEM_ID_A = '00112233-4455-6677-8899-aabbccddeeff'
		const SYSTEM_ID_B = 'ffeeddcc-bbaa-9988-7766-554433221100'

		const uint32 = (value: number): number[] => [
			(value >>> 24) & 0xff,
			(value >>> 16) & 0xff,
			(value >>> 8) & 0xff,
			value & 0xff,
		]

		const systemIdBytes = (id: string): number[] => {
			const hex = id.replaceAll('-', '')
			return Array.from({ length: 16 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16))
		}

		// A version 0 `pssh` box of 32 bytes with no data (ISO/IEC 23001-7, clause 8.1)
		const psshBox = (id: string, size = 32): number[] => [
			...uint32(size),
			...PSSH,
			0,
			0,
			0,
			0,
			...systemIdBytes(id),
			...uint32(0),
		]

		const PADDING = new Array<number>(16).fill(0xff)

		// Each form returns the entries as `Uint8Array` values. The padded view has bytes before and after the data.
		const FORMS: [string, (data: Uint8Array) => Record<string, Uint8Array>][] = [
			['Uint8Array', data => parsePsshList(data)],
			[
				'ArrayBuffer',
				data => {
					const result = parsePsshList(data.slice().buffer)
					return Object.fromEntries(
						Object.entries(result).map(([id, box]) => [id, new Uint8Array(box)]),
					)
				},
			],
			[
				'Uint8Array view with padding',
				data => {
					const padded = new Uint8Array([...PADDING, ...data, ...PADDING])
					return parsePsshList(padded.subarray(PADDING.length, PADDING.length + data.length))
				},
			],
		]

		for (const [form, parse] of FORMS) {
			describe(form, () => {
				it('returns one entry for one valid pssh box of 32 bytes', () => {
					const data = new Uint8Array(psshBox(SYSTEM_ID_A))
					const result = parse(data)

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A])
					deepStrictEqual(result[SYSTEM_ID_A], data)
				})

				it('returns no entry for a free box with a size of 0', () => {
					const data = new Uint8Array([...uint32(0), ...FREE, 1, 2, 3, 4])

					deepStrictEqual(parse(data), {})
				})

				it('reads a pssh box with a size of 0 to the end of the data', () => {
					const data = new Uint8Array(psshBox(SYSTEM_ID_A, 0))
					const result = parse(data)

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A])
					deepStrictEqual(result[SYSTEM_ID_A], data)
				})

				it('reads a pssh box with a size of 0 after a valid pssh box', () => {
					const first = psshBox(SYSTEM_ID_A)
					const last = psshBox(SYSTEM_ID_B, 0)
					const result = parse(new Uint8Array([...first, ...last]))

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A, SYSTEM_ID_B])
					deepStrictEqual(result[SYSTEM_ID_A], new Uint8Array(first))
					deepStrictEqual(result[SYSTEM_ID_B], new Uint8Array(last))
				})

				it('stops if fewer than 8 bytes remain', () => {
					const data = new Uint8Array([...uint32(8), ...FREE, 1, 2])

					deepStrictEqual(parse(data), {})
				})

				it('skips a pssh box with a size of 12 at the end of the data', () => {
					const data = new Uint8Array([...uint32(12), ...PSSH, 0, 0, 0, 0])

					deepStrictEqual(parse(data), {})
				})

				it('skips a pssh box with a size of 12 before a free box', () => {
					const free = [...uint32(28), ...FREE, ...new Array<number>(20).fill(0xaa)]
					const data = new Uint8Array([...uint32(12), ...PSSH, 0, 0, 0, 0, ...free])

					deepStrictEqual(parse(data), {})
				})

				it('reads the largesize field of a box with a size of 1', () => {
					const free = [...uint32(1), ...FREE, ...uint32(0), ...uint32(16)]
					const pssh = psshBox(SYSTEM_ID_A)
					const result = parse(new Uint8Array([...free, ...pssh]))

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A])
					deepStrictEqual(result[SYSTEM_ID_A], new Uint8Array(pssh))
				})

				it('reads the system ID after the largesize field of a pssh box', () => {
					const box = psshBox(SYSTEM_ID_A)
					const data = new Uint8Array([
						...uint32(1),
						...PSSH,
						...uint32(0),
						...uint32(40),
						...box.slice(8),
					])
					const result = parse(data)

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A])
					deepStrictEqual(result[SYSTEM_ID_A], data)
				})

				it('stops before a box that ends after the data', () => {
					const first = psshBox(SYSTEM_ID_A)
					const data = new Uint8Array([...first, ...psshBox(SYSTEM_ID_B, 40)])
					const result = parse(data)

					deepStrictEqual(Object.keys(result), [SYSTEM_ID_A])
				})

				it('stops before a box with a size below 8', () => {
					const data = new Uint8Array([...uint32(4), ...FREE, ...psshBox(SYSTEM_ID_A)])

					deepStrictEqual(parse(data), {})
				})

				it('stops before a box with a size of 1 and fewer than 16 bytes', () => {
					const data = new Uint8Array([...uint32(1), ...FREE, 0, 0, 0])

					deepStrictEqual(parse(data), {})
				})
			})
		}
	})
})
