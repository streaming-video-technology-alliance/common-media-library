/**
 * A next object request for the `nor` key: a URL, or a URL with a byte range.
 *
 * @public
 */
export type CmcdNextObject = string | { readonly url: string; readonly range?: string }
