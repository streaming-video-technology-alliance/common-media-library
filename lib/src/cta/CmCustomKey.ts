/**
 * A common media custom key. Custom keys MUST carry a hyphenated prefix 
 * to ensure that there will not be a namespace collision with future 
 * revisions to this specification. Clients SHOULD use a reverse-DNS 
 * syntax when defining their own prefix.
 * 
 * @group CMCD
 * @group CMSD
 */
export type CmCustomKey = `${string}-${string}`;
