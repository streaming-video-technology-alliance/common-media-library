import { isArrayBufferLike } from '@svta/cml-utils'

/**
 * Parses a list of PSSH boxes into keysystem-specific PSSH data.
 * Supports zero and extended box sizes. Stops at invalid box boundaries and skips short PSSH boxes.
 *
 * @param data - The concatenated list of PSSH boxes as provided by
 * the CDM as initialization data when CommonEncryption content is detected
 * @returns An object that has a property named according to each of
 * the detected key system UUIDs (e.g. 00000000-0000-0000-0000-0000000000)
 * and a ArrayBuffer (the entire PSSH box) as the property value
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/cenc/parsePsshList.test.ts#example}
 */
export function parsePsshList(data: ArrayBufferLike): Record<string, ArrayBufferLike>
/**
 * Parses a list of PSSH boxes into keysystem-specific PSSH data.
 * Supports zero and extended box sizes. Stops at invalid box boundaries and skips short PSSH boxes.
 *
 * @param data - The concatenated list of PSSH boxes as a `Uint8Array`.
 * @returns An object that has a property named according to each of
 * the detected key system UUIDs and a `Uint8Array` (the entire PSSH box)
 * as the property value
 *
 * @public
 */
export function parsePsshList(data: Uint8Array): Record<string, Uint8Array>
export function parsePsshList(
	data: ArrayBufferLike | Uint8Array,
): Record<string, ArrayBufferLike | Uint8Array> {
	if (!data) {
		return {}
	}

	// data.buffer first for Uint8Array support
	const dv = isArrayBufferLike(data)
		? new DataView(data)
		: new DataView(data.buffer, data.byteOffset, data.byteLength)
	const pssh: Record<string, ArrayBufferLike | Uint8Array> = {}
	let byteCursor = 0

	while (byteCursor < dv.byteLength) {
		const boxStart = byteCursor
		const remaining = dv.byteLength - boxStart
		if (remaining < 8) {
			break
		}

		let size = dv.getUint32(boxStart)
		let headerSize = 8
		if (size === 1) {
			if (remaining < 16) {
				break
			}
			size = dv.getUint32(boxStart + 8) * 0x100000000 + dv.getUint32(boxStart + 12)
			headerSize = 16
		} else if (size === 0) {
			size = remaining
		}

		if (size < headerSize || size > remaining) {
			break
		}
		const nextBox = boxStart + size

		// A PSSH box needs version, flags, SystemID, and data size after its header.
		if (dv.getUint32(boxStart + 4) !== 0x70737368 || size < headerSize + 24) {
			byteCursor = nextBox
			continue
		}
		byteCursor = boxStart + headerSize

		// Version must be 0 or 1
		const version = dv.getUint8(byteCursor)
		if (version !== 0 && version !== 1) {
			byteCursor = nextBox
			continue
		}

		byteCursor += 1 // Move past version
		byteCursor += 3 // Skip flags

		// 16-byte UUID/SystemID
		let systemID = ''
		let val: string

		for (let i = 0; i < 4; i++) {
			val = dv.getUint8(byteCursor + i).toString(16)
			systemID += val.length === 1 ? '0' + val : val
		}
		byteCursor += 4
		systemID += '-'

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16)
			systemID += val.length === 1 ? '0' + val : val
		}
		byteCursor += 2
		systemID += '-'

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16)
			systemID += val.length === 1 ? '0' + val : val
		}
		byteCursor += 2
		systemID += '-'

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16)
			systemID += val.length === 1 ? '0' + val : val
		}
		byteCursor += 2
		systemID += '-'

		for (let i = 0; i < 6; i++) {
			val = dv.getUint8(byteCursor + i).toString(16)
			systemID += val.length === 1 ? '0' + val : val
		}
		byteCursor += 6

		systemID = systemID.toLowerCase()

		// PSSH Data Size
		byteCursor += 4

		// PSSH boxdata
		pssh[systemID] = data.slice(boxStart, nextBox)

		byteCursor = nextBox
	}

	return pssh
}
