import { STRING } from '../fields/STRING.ts'
import type { IsoView } from '../IsoView.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
 */
export class FileTypeBox extends Box {
	static readonly type = 'ftyp'

	/**
	 * Reads a FileTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
	 */
	static read(view: IsoView): FileTypeBox {
		const size = 4
		const majorBrand = view.readString(4)
		const minorVersion = view.readUint(4)
		const length = view.bytesRemaining / size
		const compatibleBrands = view.readArray(STRING, size, length)
		return new FileTypeBox(majorBrand, minorVersion, compatibleBrands)
	}

	override get size(): number {
		// 8 bytes header + 4 (majorBrand) + 4 (minorVersion) + (4 * compatibleBrands.length)
		return 16 + (this.compatibleBrands.length * 4)
	}

	/**
	 * Writes a FileTypeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
	 */
	static write(box: FileTypeBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4

		// Write box type (4 bytes) - 'ftyp'
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write majorBrand (4 bytes)
		writeString(dataView, cursor, 4, box.majorBrand)
		cursor += 4

		// Write minorVersion (4 bytes)
		writeUint(dataView, cursor, 4, box.minorVersion)
		cursor += 4

		// Write compatibleBrands (4 bytes each)
		for (const brand of box.compatibleBrands) {
			writeString(dataView, cursor, 4, brand)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	majorBrand: string
	minorVersion: number
	compatibleBrands: string[]

	constructor(majorBrand: string, minorVersion: number, compatibleBrands: string[] = []) {
		super('ftyp')
		this.majorBrand = majorBrand
		this.minorVersion = minorVersion
		this.compatibleBrands = compatibleBrands
	}

	override get size(): number {
		// 8 bytes header + 4 (majorBrand) + 4 (minorVersion) + (4 * compatibleBrands.length)
		return 16 + (this.compatibleBrands.length * 4)
	}
}
