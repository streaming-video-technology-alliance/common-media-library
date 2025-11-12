import type { FileTypeBox } from '../boxes/FileTypeBox.ts'
import { STRING } from '../fields/STRING.ts'
import type { IsoView } from '../IsoView.ts'
import { BoxBase } from './BoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
 */
export class ftyp extends BoxBase<FileTypeBox> {
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
		return new ftyp(majorBrand, minorVersion, compatibleBrands)
	}

	/**
	 * Writes a FileTypeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
	 */
	static write(box: FileTypeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeString(box.majorBrand)
		view.writeUint(box.minorVersion, 4)
		for (const brand of box.compatibleBrands) {
			view.writeString(brand)
		}
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
		// 4 (majorBrand) + 4 (minorVersion) + (4 * compatibleBrands.length)
		return 8 + (this.compatibleBrands.length * 4)
	}
}
