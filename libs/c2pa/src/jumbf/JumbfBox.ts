/**
 * A parsed JUMBF box (ISO 19566-5)
 *
 * @public
 */
export type JumbfBox = {
	readonly type: string
	readonly data: Uint8Array
}
