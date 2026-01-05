import type { KeySystem } from './KeySystem.ts'

export type KeySystemMap = Record<KeySystem, {
	pssh: string;
}>;
