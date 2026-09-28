/**
 * Maps a key to the object types (`ot`) for which CTA-5004-B allows the key.
 *
 * A key that is absent from this map is allowed for every object type.
 * `d` (Object duration) and `tpb` (Top playable bitrate) MUST NOT be sent for
 * other object types.
 *
 * @internal
 */
export const CMCD_KEY_OBJECT_TYPES: Record<string, readonly string[]> = {
	d: ['a', 'v', 'av', 'tt', 'c', 'o'] as const,
	tpb: ['a', 'v', 'av', 'c'] as const,
}
