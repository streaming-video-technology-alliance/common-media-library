import { UINT } from '../fields/UINT';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type TrackEncryptionBox = FullBox & {
	defaultIsEncrypted: number;
	defaultIvSize: number;
	defaultKid: number[];
};

//ISO/IEC 23001-7:2011 - 8.2 Track Encryption Box
export function tenc(view: IsoView): TrackEncryptionBox {
	return {
		...view.readFullBox(),
		defaultIsEncrypted: view.readUint(3),
		defaultIvSize: view.readUint(1),
		defaultKid: view.readArray(UINT, 1, 16),
	};
};
