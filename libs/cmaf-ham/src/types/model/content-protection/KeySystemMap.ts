import type { KeySystem } from './KeySystem.ts'

/**
 * CMAF-HAM Key System Map type
 *
 * @alpha
 */
export type KeySystemMap = Record<KeySystem, {
	pssh: string;
}>;
