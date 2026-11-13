import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackEncryptionBox` from an `IsoBoxReadView`.
 *
 * ISO/IEC 23001-7:2016 - 8.2 Track Encryption Box
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
	const defaultIsEncrypted = view.readUint(3)
	const defaultIvSize = view.readUint(1)
	const box: TrackEncryptionBox = {
		type: 'tenc',
		version,
		flags,
		defaultIsEncrypted,
		defaultIvSize,
		defaultKid: view.readArray(UINT, 1, 16),
	}

	if (version > 0) {
		box.defaultCryptByteBlock = (defaultIsEncrypted >> 12) & 0xf
		box.defaultSkipByteBlock = (defaultIsEncrypted >> 8) & 0xf
	}

	if ((defaultIsEncrypted & 0xff) === 1 && defaultIvSize === 0 && !view.done) {
		box.defaultConstantIvSize = view.readUint(1)
		box.defaultConstantIv = Array.from(view.readData(box.defaultConstantIvSize))
	}

	return box
}
