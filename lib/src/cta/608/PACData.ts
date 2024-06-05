/**
 * Represents a single PAC (Preamble Address Code) data.
 *
 * @group CTA-608
 * @beta
 */
export interface PACData {
	row: number;
	indent: number | null;
	color: string | null;
	underline: boolean;
	italics: boolean;
}
