import type { FullBox } from './FullBox.js';

/**
 * Protection System Specific Header Box - 'pssh'
 */
export type ProtectionSystemSpecificHeaderBox = FullBox & {
	type: 'pssh';
	systemId: Uint8Array;
	KIDs?: Uint8Array[];
	data: Uint8Array;
};
