import type { ContainerBox } from '../boxes/ContainerBox.ts'
import type { FullBox } from '../boxes/FullBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a ContainerBox to an IsoDataWriter.
 *
 * This function writes a container box with its child boxes. Child boxes should be
 * pre-encoded as Uint8Array or IsoDataWriter instances.
 *
 * @param box - The ContainerBox to write
 * @param childBoxes - Array of pre-encoded child boxes as Uint8Array or IsoDataWriter
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeContainerBox<T>(
	box: ContainerBox<T>,
	childBoxes: ArrayBufferView[]
): IsoDataWriter {
	const headerSize = 8
	const isFullBox = 'version' in box && 'flags' in box
	const fullBoxSize = isFullBox ? 4 : 0

	// Calculate total size of all child boxes
	let childBoxesSize = 0
	for (const childBox of childBoxes) {
		childBoxesSize += childBox.byteLength
	}

	const totalSize = headerSize + fullBoxSize + childBoxesSize

	const writer = new IsoDataWriter(totalSize)

	// Handle largesize if needed
	if (box.largesize !== undefined) {
		writer.writeBoxHeader(box.type, totalSize, box.largesize)
	} else {
		writer.writeBoxHeader(box.type, totalSize)
	}

	// Write FullBox header if applicable
	if (isFullBox) {
		const fullBox = box as ContainerBox<T> & FullBox
		writer.writeFullBox(fullBox.version, fullBox.flags)
	}

	// Write all child boxes
	for (const childBox of childBoxes) {
		writer.writeBytes(new Uint8Array(childBox.buffer, childBox.byteOffset, childBox.byteLength))
	}

	return writer
}

