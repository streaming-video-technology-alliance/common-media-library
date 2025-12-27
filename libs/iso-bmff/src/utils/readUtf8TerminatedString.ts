import { decodeText, UTF_8 } from '@svta/cml-utils'

/**
 * Reads a UTF-8 terminated string from a data view.
 *
 * @param dataView - The data view to read from.
 * @param offset - The offset to start reading from.
 * @returns The UTF-8 terminated string.
 *
 * @internal
 */
export function readUtf8TerminatedString(dataView: DataView<ArrayBuffer>, offset: number): string {
	const length = dataView.byteLength - (offset - dataView.byteOffset)

	let data = ''

	if (length > 0) {
		const view = new DataView(dataView.buffer, offset, length)

		let l = 0

		for (; l < length; l++) {
			if (view.getUint8(l) === 0) {
				break
			}
		}

		// remap the Dataview with the actual length
		data = decodeText(new DataView(dataView.buffer, offset, l), { encoding: UTF_8 })
	}

	return data
};
