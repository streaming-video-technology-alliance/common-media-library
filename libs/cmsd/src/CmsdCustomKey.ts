/**
 * A custom key for CMSD. Custom keys MUST carry a hyphenated prefix
 * to ensure that there will not be a namespace collision with future
 * revisions to this specification. Clients SHOULD use a reverse-DNS
 * syntax when defining their own prefix.
 *
 * The type requires a lowercase hyphenated string. At runtime a key
 * must also satisfy {@link isCmsdCustomKey} (a lowercase first
 * letter, then characters from `a-z 0-9 . -`, with a hyphen that is
 * neither the first nor the last character), the subset of the CMSD
 * custom-key grammar that survives RFC 8941 key serialization. Keys
 * failing it fail structured-field serialization at encode time.
 * Lowercase reverse-DNS names satisfy all constraints.
 *
 * @public
 */
export type CmsdCustomKey = Lowercase<`${string}-${string}`>;
