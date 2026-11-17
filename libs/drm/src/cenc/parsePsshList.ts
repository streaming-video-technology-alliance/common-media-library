import { isArrayBufferLike } from '@svta/cml-utils'

/**
 * Parses a list of PSSH boxes into keysystem-specific PSSH data.
 *
 * The function stops before a box if the data ends inside the header or the body of that box.
 * The function also stops before a box with a size below the size of its header.
 * The function then returns the entries before that box and does not throw.
 * The function skips a `pssh` box that ends before its data size field.
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
 *
 * The function stops before a box if the data ends inside the header or the body of that box.
 * The function also stops before a box with a size below the size of its header.
 * The function then returns the entries before that box and does not throw.
 * The function skips a `pssh` box that ends before its data size field.
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
	const length = dv.byteLength
	const pssh: Record<string, ArrayBufferLike | Uint8Array> = {}
	let offset = 0

	// Box header rules of ISO/IEC 14496-12, clause 4.2
	while (length - offset >= 8) {
		const remaining = length - offset
		let size = dv.getUint32(offset)
		let headerSize = 8

		if (size === 1) {
			headerSize = 16

			if (remaining < headerSize) {
				break
			}

			size = dv.getUint32(offset + 8) * 0x100000000 + dv.getUint32(offset + 12)
		} else if (size === 0) {
			size = remaining
		}

		if (size < headerSize || size > remaining) {
			break
		}

		const end = offset + size

		// The full box header, the system ID, and the data size field of ISO/IEC 23001-7, clause 8.1
		if (dv.getUint32(offset + 4) === 0x70737368 && size - headerSize >= 24) {
			const fields = offset + headerSize
			const version = dv.getUint8(fields)

			if (version === 0 || version === 1) {
				let systemID = ''

				for (let i = 0; i < 16; i++) {
					if (i === 4 || i === 6 || i === 8 || i === 10) {
						systemID += '-'
					}

					const val = dv.getUint8(fields + 4 + i).toString(16)
					systemID += val.length === 1 ? '0' + val : val
				}

				pssh[systemID] = data.slice(offset, end)
			}
		}

		offset = end
	}

	return pssh
}
