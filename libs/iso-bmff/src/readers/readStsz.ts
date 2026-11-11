import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SampleSizeBox` from an `IsoBoxReadView`.
 *
 * When `sampleSize` is not 0, `entrySize` is `undefined`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.3 Sample Size Box
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleSizeBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStsz.test.ts#example}
 *
 * @public
 */
export function readStsz(view: IsoBoxReadView): SampleSizeBox {
	const { version, flags } = view.readFullBox()
	const sampleSize = view.readUint(4)
	const sampleCount = view.readUint(4)

	return {
		type: 'stsz',
		version,
		flags,
		sampleSize,
		sampleCount,
		entrySize: sampleSize === 0 ? view.readArray(UINT, 4, sampleCount) : undefined,
	}
}
