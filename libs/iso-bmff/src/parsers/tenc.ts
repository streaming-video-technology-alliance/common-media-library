import type { Fields } from '../boxes/Fields.ts';
import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts';
import { UINT } from '../fields/UINT.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a TrackEncryptionBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackEncryptionBox
 *
 *
 * @beta
 */
export function tenc(view: IsoView): Fields<TrackEncryptionBox> {
	return {
		...view.readFullBox(),
		defaultIsEncrypted: view.readUint(3),
		defaultIvSize: view.readUint(1),
		defaultKid: view.readArray(UINT, 1, 16),
	};
};
