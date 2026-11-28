import {
	createIsoBoxWriteCursor,
	type IsoBoxWriteConfig,
	type IsoBoxWriter,
} from '@svta/cml-iso-bmff'

/**
 * Writes one box with a writer on a new write cursor.
 *
 * @param writer - The writer of the box.
 * @param box - The box.
 * @param config - The writers of the child boxes.
 * @returns The written bytes, in a new array with the exact size.
 */
export function writeWith<B>(
	writer: IsoBoxWriter<B>,
	box: B,
	config?: IsoBoxWriteConfig,
): Uint8Array<ArrayBuffer> {
	const cursor = createIsoBoxWriteCursor({ writers: config?.writers })

	writer(cursor, box)

	return cursor.bytes.slice(0, cursor.pos)
}
