import { STRING } from '../fields/STRING.ts'
import type { IsoView } from '../IsoView.ts'
import { Box } from './Box.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
 */
export class SegmentTypeBox extends Box {
	static readonly type = 'styp'

	/**
	 * Reads a SegmentTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
	 */
	static read(view: IsoView): SegmentTypeBox {
		const size = 4
		const majorBrand = view.readString(4)
		const minorVersion = view.readUint(4)
		const length = view.bytesRemaining / size
		const compatibleBrands = view.readArray(STRING, size, length)
		return new SegmentTypeBox(majorBrand, minorVersion, compatibleBrands)
	}

	/**
	 * Writes a SegmentTypeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
	 */
	static write(box: SegmentTypeBox, view: IsoDataWriter): void {
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
		super('styp')
		this.majorBrand = majorBrand
		this.minorVersion = minorVersion
		this.compatibleBrands = compatibleBrands
	}

	override get size(): number {
		// 8 bytes header minimum
		return 8
	}
}
