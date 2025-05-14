import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SoundMediaHeaderBox = FullBox & {
	balance: number;
	reserved: number;
};

/**
 * Parse a SoundMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SoundMediaHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function smhd(view: IsoView): SoundMediaHeaderBox {
	return {
		...view.readFullBox(),
		balance: view.readUint(2),
		reserved: view.readUint(2),
	};
};
