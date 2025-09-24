import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 23001-7:2011 - 8.1 Protection System Specific Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ProtectionSystemSpecificHeaderBox = FullBox & {
	type: 'pssh';
	systemId: number[];
	kidCount: number;
	kid: number[];
	dataSize: number;
	data: number[];
};
