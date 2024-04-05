/**
 * Styled character.
 */
export class StyledChar {
	private character_: string;
	private underline_: boolean;
	private italics_: boolean;
	private backgroundColor_: string;
	private textColor_: string;

	/**
	 * @param character - Character.
	 * @param underline - Whether the character is underlined.
	 * @param italics - Whether the character is italicized.
	 * @param backgroundColor - Background color.
	 * @param textColor - Text color.
	 */
	constructor(
		character: string,
		underline: boolean,
		italics: boolean,
		backgroundColor: string,
		textColor: string
	) {
		this.character_ = character;
		this.underline_ = underline;
		this.italics_ = italics;
		this.backgroundColor_ = backgroundColor;
		this.textColor_ = textColor;
	}

	/**
	 */
	getChar(): string {
		return this.character_;
	}

	/**
	 */
	isUnderlined(): boolean {
		return this.underline_;
	}

	/**
	 */
	isItalicized(): boolean {
		return this.italics_;
	}

	/**
	 */
	getBackgroundColor(): string {
		return this.backgroundColor_;
	}

	/**
	 */
	getTextColor(): string {
		return this.textColor_;
	}
}
