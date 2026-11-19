import type { IsoBoxStreamable } from '../IsoBoxStreamable.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import { CONTAINERS } from './CONTAINERS.ts'
import { writeContainerBox } from './writeContainerBox.ts'

/**
 * Write a box to a Uint8Array.
 *
 * @param box - The box to write
 * @param config - The writer configuration
 * @returns The written box. A box given as a view over a `SharedArrayBuffer` is copied, so the result is always backed by an `ArrayBuffer`.
 *
 * @internal
 */
export function writeBox(
	box: IsoBoxStreamable<IsoInt64>,
	config: IsoBoxWriteConfig,
): Uint8Array<ArrayBuffer> {
	let view: ArrayBufferView | null = null

	if ('type' in box) {
		const { type } = box
		const writer = config.writers?.[type]

		if ('bytes' in box) {
			view = box.bytes
		} else if (writer) {
			// TODO: Find a better way to do this without casting to any
			view = writer(box as any, config)
		} else if (CONTAINERS.includes(type)) {
			view = writeContainerBox(box as IsoBoxContainer<IsoInt64>, config)
		}

		if (!view) {
			throw new Error(`No writer found for box type: ${type}`)
		}
	}

	if ('buffer' in box) {
		view = box
	}

	if (!view) {
		throw new Error('Invalid box')
	}

	const { buffer, byteOffset, byteLength } = view

	if (isSharedArrayBuffer(buffer)) {
		return new Uint8Array(buffer, byteOffset, byteLength).slice()
	}

	return new Uint8Array(buffer, byteOffset, byteLength)
}

function isSharedArrayBuffer(buffer: ArrayBufferLike): buffer is SharedArrayBuffer {
	return typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer
}
