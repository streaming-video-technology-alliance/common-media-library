import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stsz` box (`SampleSizeBox`).
 *
 * When `sampleSize` is not 0, `entrySize` is `undefined`.
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
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
export function readStsz(view: IsoBoxReadView<IsoInt64>): SampleSizeBox {
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
