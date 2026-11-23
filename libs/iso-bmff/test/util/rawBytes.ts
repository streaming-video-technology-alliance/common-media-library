import { filterIsoBoxes, readIsoBoxes } from '@svta/cml-iso-bmff'
import { load } from './load.ts'

/**
 * Returns the bytes of each box of a type in a fixture, in the order of the file.
 * The read uses no reader, so each box of the type is a raw box.
 *
 * @param file - The fixture file.
 * @param type - The box type.
 * @returns The bytes of each box, with the header.
 */
export function rawBytes(file: string, type: string): Uint8Array[] {
	return filterIsoBoxes(readIsoBoxes(load(file)), box => !box.type && box.boxType === type).map(
		box => (box.type ? new Uint8Array() : box.bytes),
	)
}
