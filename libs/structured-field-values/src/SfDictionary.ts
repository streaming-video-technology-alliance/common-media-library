import type { SfMember } from './SfMember.ts'

/**
 * A dictionary of structured field members.
 *
 * @public
 */
export type SfDictionary = Record<string, SfMember> | Map<string, SfMember>;
