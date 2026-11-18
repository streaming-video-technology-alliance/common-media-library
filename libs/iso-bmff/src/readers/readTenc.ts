import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tenc` box (`TrackEncryptionBox`).
 *
 * ISO/IEC 23001-7:2016 - 8.2
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackEncryptionBox`
 *
 * @example
 * {@includeCode ../../test/readers/readTenc.test.ts#example}
 *
 * @public
 */
export function readTenc(view: IsoBoxReadView<IsoInt64>): TrackEncryptionBox {
	const { version, flags } = view.readFullBox()
	view.jump(1)
	const pattern = view.readUint(1)
	const defaultIsProtected = view.readUint(1)
	const defaultPerSampleIvSize = view.readUint(1)
	const box: TrackEncryptionBox = {
		type: 'tenc',
		version,
		flags,
		defaultPerSampleIvSize,
		defaultKid: view.readArray(UINT, 1, 16),
		defaultIsProtected,
	}

	if (version > 0) {
		box.defaultCryptByteBlock = pattern >> 4
		box.defaultSkipByteBlock = pattern & 0xf
	}

	if (defaultIsProtected === 1 && defaultPerSampleIvSize === 0 && !view.done) {
		box.defaultConstantIvSize = view.readUint(1)
		box.defaultConstantIv = view.readArray(UINT, 1, box.defaultConstantIvSize)
	}

	return box
}
