/**
 * A position in a buffer that grows, for the write field functions.
 *
 * A field function writes at `pos` and moves `pos` past the field.
 * The written bytes are `cursor.bytes.subarray(0, cursor.pos)`.
 *
 * When a field does not fit, the cursor doubles its buffer. The growth replaces `view` and `bytes`.
 * Write through the field functions. A variable that keeps `view` or `bytes` points to the old buffer after a growth.
 *
 * @public
 */
export type IsoBoxWriteCursor = {
	/**
	 * A view of the complete buffer, with the unused capacity.
	 */
	readonly view: DataView

	/**
	 * The bytes of the complete buffer, with the unused capacity.
	 */
	readonly bytes: Uint8Array<ArrayBuffer>

	/**
	 * The position of the next write.
	 */
	pos: number
}
