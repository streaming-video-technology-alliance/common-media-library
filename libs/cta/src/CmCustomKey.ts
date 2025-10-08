/**
 * Custom key for use in Common Media data. Custom keys MUST carry a hyphenated prefix
 * to ensure that there will not be a namespace collision with future
 * revisions to this specification. Clients SHOULD use a reverse-DNS
 * syntax when defining their own prefix.
 *
 *
 * @beta
 */
export type CmCustomKey = `${string}-${string}`;
