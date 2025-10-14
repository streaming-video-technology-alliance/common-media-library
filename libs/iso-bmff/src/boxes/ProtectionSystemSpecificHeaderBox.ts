import type { FullBox } from './FullBox.ts';

/**
 * ISO/IEC 23001-7:2011 - 8.1 Protection System Specific Header Box
 *
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
