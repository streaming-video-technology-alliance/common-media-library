import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

export type SoundMediaHeaderBox = FullBox & {
	balance: number;
	reserved: number;
};

// ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
export function smhd(view: IsoView): SoundMediaHeaderBox {
	return {
		...view.readFullBox(),
		balance: view.readUint(2),
		reserved: view.readUint(2),
	};
};
