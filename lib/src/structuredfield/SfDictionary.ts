import type { SfMember } from './SfMember';

/**
 * A dictionary of structured field members.
 *
 * @group Structured Field
 *
 * @beta
 */
export type SfDictionary = Record<string, SfMember> | Map<string, SfMember>;
