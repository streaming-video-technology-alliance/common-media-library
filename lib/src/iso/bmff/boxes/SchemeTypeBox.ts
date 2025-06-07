import type { FullBox } from './FullBox.js';

/**
 * Scheme Type Box - 'schm'
 */
export type SchemeTypeBox = FullBox & {
	type: 'schm';
	schemeType: string;
	schemeVersion: number;
	schemeUri?: string;
};
