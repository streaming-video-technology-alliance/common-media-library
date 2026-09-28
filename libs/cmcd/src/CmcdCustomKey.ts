/**
 * A custom key for CMCD. Custom keys MUST have a hyphenated prefix
 * to ensure that there will not be a namespace collision with future
 * revisions to this specification. Clients SHOULD use a reverse-DNS
 * syntax when defining their own prefix.
 *
 * The type requires a lowercase hyphenated string. At runtime a key
 * must also satisfy {@link isCmcdCustomKey}: a lowercase first
 * letter, then characters from `a-z 0-9 . -`. The key needs a hyphen
 * that is neither first nor last. The check restricts the CMCD
 * custom-key grammar to names that RFC 8941 key serialization accepts.
 * Preparation drops keys that fail the check. Lowercase reverse-DNS
 * names satisfy all constraints.
 *
 * @public
 */
export type CmcdCustomKey = Lowercase<`${string}-${string}`>;
