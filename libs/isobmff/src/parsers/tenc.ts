import type { Fields } from '../boxes/Fields.js';
import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackEncryptionBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackEncryptionBox
 *
 * @group ISOBMFF
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
