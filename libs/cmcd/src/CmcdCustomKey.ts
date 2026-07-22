/**
 * A custom key for CMCD. Custom keys MUST carry a hyphenated prefix
 * to ensure that there will not be a namespace collision with future
 * revisions to this specification. Clients SHOULD use a reverse-DNS
 * syntax when defining their own prefix.
 *
 * This type is intentionally loose — it accepts any hyphenated string.
 * At runtime a key must also satisfy {@link isCmcdCustomKey}
 * (characters `a-z A-Z 0-9 . -`, with a hyphen that is neither the
 * first nor the last character) and RFC 8941 key serialization
 * (lowercase first character, then `a-z 0-9 - _ . *`) to reach the
 * wire; keys failing either check are dropped during preparation.
 * Lowercase reverse-DNS names satisfy both.
 *
 * @public
 */
export type CmcdCustomKey = `${string}-${string}`;
