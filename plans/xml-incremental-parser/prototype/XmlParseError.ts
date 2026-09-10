/**
 * Error thrown for markup the scanner rejects. `offset` is the character index the message refers to;
 * `line` (0-based) and `column` (1-based) describe the same position, as the messages have always
 * reported them.
 */
export class XmlParseError extends Error {
	readonly offset: number
	readonly line: number
	readonly column: number

	constructor(message: string, offset: number, line: number, column: number) {
		super(message)
		this.name = 'XmlParseError'
		this.offset = offset
		this.line = line
		this.column = column
	}
}
